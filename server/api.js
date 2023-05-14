const User = require("../models/user");
const Item = require("../models/item");
const objectAssign = require("object-assign");
const { Client } = require("minio");
const multer = require("multer");
const path = require("path");
const cp = require("child_process");
const fs = require("fs");
const { nanoid } = require("nanoid");

const uploadDir = path.resolve(process.cwd(), "uploads");

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 512000 },
}).single("itemPic");

module.exports = function (app) {
  const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT,
    useSSL: true,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });

  const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.json({ error: "UNAUTHORIZED" });
    }
  };

  app.get("/isUserLoggedIn", isLoggedIn, (req, res) => {
    res.json({ error: "", notificationsCount: req.user.notificationsCount });
  });

  app.get("/api/getProfileData", isLoggedIn, (req, res) => {
    const { name, address, phoneNo, email, dp } = req.user;
    res.json({ name, address, phoneNo, email, dp });
  });

  app.post("/api/setProfileData", isLoggedIn, (req, res) => {
    const { landmark, city, state, pinCode, country, localAddress } = req.body;
    const address = { landmark, city, state, pinCode, country, localAddress };
    const phoneNo = req.body.phoneNo;
    const email = req.body.email;
    const newProfileData =
      req.query.edit === "location" ? { address } : { phoneNo, email };
    User.findByIdAndUpdate(req.user.id, newProfileData, { new: true })
      .then((doc) => {
        const { address, phoneNo, email } = doc;
        res.json({ address, phoneNo, email });
      })
      .catch(() => {
        res
          .status(500)
          .send({ error: "Error happened while updating user info!" });
      });
  });

  app.post("/api/addMyItem", (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        res.status(500).send("File upload failed.").end();
      } else {
        if (!req.file) {
          return res.status(403).send("Please upload a picture of item!").end();
        }

        if (!/^image\/(jpe?g|png|gif)$/i.test(req.file.mimetype)) {
          return res
            .status(403)
            .send("Please upload JPEG or PNG or GIF image file!")
            .end();
        }

        const date = new Date();
        const fileStream = fs.createReadStream(req.file.path);
        const fileExtension = path.extname(req.file.originalname);
        const fileKey = `${nanoid(6)}`;
        const fileName = `${fileKey}${fileExtension}`;
        const ownerInfo = {
          itemOwnerId: req.user._id,
          itemOwner: req.user.name,
        };
        const data = objectAssign(
          {},
          req.body,
          {
            itemAdditionDate: date.toDateString().slice(4),
            itemRequests: [],
            key: fileKey,
            fileName,
          },
          ownerInfo
        );
        const newItem = new Item(data);

        const metaData = {
          "Content-Type": req.file.mimetype,
          "X-Amz-Meta-Testing": 1234,
        };

        minioClient.putObject(
          process.env.MINIO_BUCKET,
          fileName,
          fileStream,
          metaData,
          (err) => {
            if (err) {
              console.error("Error happened while uploading to minio-", err);
              return res.status(500).send({
                error: "Some error happened while uploading image file!",
              });
            }

            newItem.itemPic = `${minioClient.protocol}//${minioClient.host}:${minioClient.port}/${process.env.MINIO_BUCKET}/${fileName}`;
            newItem
              .save()
              .then((doc) => {
                const item = objectAssign({}, doc.toObject());
                delete item._id;
                delete item.__v;
                delete item.itemOwnerId;
                res.json(item);
              })
              .catch((err) => {
                console.error("Error happened while adding new item-", err);
                res.status(500).send({
                  error: "Some error happened while adding new item!",
                });
              });

            // clear the uploadDir
            cp.exec("rm -r " + uploadDir + "/*", (err) => {
              if (err) {
                console.error("Error happened while clearing uploadDir-", err);
              }
            });
          }
        );
      }
    });
  });

  app.get("/api/getMyItemsData", isLoggedIn, (req, res) => {
    Item.find(
      { itemOwnerId: req.user._id.toString() },
      [
        "key",
        "itemName",
        "itemPic",
        "itemCurrency",
        "itemAdditionDte",
        "itemPrice",
        "itemDescription",
        "itemTags",
        "fileName",
      ],
      {
        sort: { key: -1 },
      }
    )
      .then((docs) => {
        res.json(docs);
      })
      .catch((err) => {
        console.error("Error happened while loading myItems-", err);
        res.status(500).send({
          error: "Some error happened while loading all of your items!",
        });
      });
  });

  // Checks first whether user is loggedIn or not then deletes item ioi item's owner is current user
  app.delete("/api/deleteMyItem/:name", isLoggedIn, (req, res) => {
    console.log("deleting item with name", req.params.name);
    Item.findOneAndRemove({
      fileName: req.params.name,
      itemOwnerId: req.user._id,
    })
      .then(() => {
        minioClient.removeObject(
          process.env.MINIO_BUCKET,
          `${req.params.name}`,
          function (err) {
            if (err) {
              console.error(
                "Error happened while deleting item with name",
                req.params.name,
                "-",
                err
              );
              return res.sendStatus(500);
            }
            res.sendStatus(200);
          }
        );
      })
      .catch((err) => {
        console.error(
          "Error happened while deleting item with name",
          req.params.name,
          "-",
          err
        );
        res.sendStatus(500);
      });
  });

  app.get("/api/getAllItemsData", (req, res) => {
    Item.find({}, ["key", "itemName", "itemCurrency", "itemPrice", "itemPic"], {
      sort: { key: -1 },
    })
      .then((docs) => {
        res.json(docs);
      })
      .catch((err) => {
        console.error("Error happened while loading allItems-", err);
        res.sendStatus(500);
      });
  });

  app.get("/api/getIndividualItemData/:key", (req, res) => {
    Item.findOne({ key: req.params.key }, [
      "key",
      "itemName",
      "itemCurrency",
      "itemPrice",
      "itemPic",
      "itemRequests",
      "itemDescription",
      "itemAdditionDate",
      "itemTags",
      "itemOwner",
      "itemOwnerId",
      "fileName",
    ])
      .then((doc) => {
        if (doc) {
          const isSoldOut = doc.itemRequests.some(
            (elem) => elem.reqStatus === "ACCEPTED"
          );

          const item = objectAssign({}, doc.toObject());

          let itemRequestedByCurrentUser = false;

          if (req.user) {
            itemRequestedByCurrentUser = item.itemRequests.some(
              (elem) => elem.reqMaker.id === req.user._id.toString()
            );
          }

          const ownItem =
            item.itemOwnerId === (req.user && req.user._id.toString());
          delete item._id;
          delete item.itemOwnerId;
          delete item.__v;
          item.ownItem = ownItem;
          res.json(
            objectAssign(item, { itemRequestedByCurrentUser, isSoldOut })
          );
        } else {
          res.sendStatus(400);
        }
      })
      .catch((err) => {
        console.error("Error happened while loading individual Item-", err);
        res.sendStatus(500);
      });
  });

  app.get("/api/requestitem/:key", isLoggedIn, (req, res) => {
    Item.findOne({ key: parseInt(req.params.key, 10) })
      .exec()
      .then((doc) => {
        return User.findOne({ _id: doc.itemOwnerId })
          .exec()
          .then((userDoc) => {
            userDoc.notificationsCount += 1;
            userDoc.markModified("notificationsCount");
            return userDoc.save();
          })
          .then(() => doc);
      })
      .then((doc) => {
        const itemRequestedByCurrentUser = doc.itemRequests.some(
          (elem) => elem.reqMaker.id === req.user._id.toString()
        );

        const isSoldOut = doc.itemRequests.some(
          (elem) => elem.reqStatus === "ACCEPTED"
        );

        if (isSoldOut) {
          res.status(409).send("Item Sold Out");
        } else if (!itemRequestedByCurrentUser) {
          const itemRequest = {
            reqMaker: {
              uniqueId: new Date().getTime(),
              id: req.user._id.toString(),
              name: req.user.name,
            },
            reqStatus: "PENDING",
          };
          doc.itemRequests.push(itemRequest);
          return doc.save().then((doc) => {
            const proposedTrade = {};
            proposedTrade.id = req.params.key;
            proposedTrade.itemName = doc.itemName;
            proposedTrade.itemPic = doc.itemPic;
            proposedTrade.itemOwner = doc.itemOwner;
            proposedTrade.reqStatus = "PENDING";
            proposedTrade.reqMakerInfo = [];
            req.user.trades.unshift(proposedTrade);
            req.user.markModified("trades");
            return req.user.save().then(() => {
              const itemRequestedByCurrentUser = true;
              res.json(
                objectAssign({}, doc.toObject(), {
                  itemRequestedByCurrentUser,
                })
              );
            });
          });
        } else {
          res.json(doc.toObject());
        }
      })
      .catch((err) => {
        console.error("Error happened while loading allItems-", err);
        res.sendStatus(500);
      });
  });

  app.get("/api/getTradesData", isLoggedIn, (req, res) => {
    Item.find(
      { itemOwnerId: req.user._id },
      { itemRequests: 1, _id: 0, itemPic: 1, itemName: 1, key: 1 }
    )
      .then((docs) => {
        let requests = docs.filter((elem) => elem.itemRequests.length > 0);
        requests = requests.map((elem) => {
          elem.itemRequests = elem.itemRequests.map((elemItem) => {
            return {
              reqStatus: elemItem.reqStatus,
              reqMaker: elemItem.reqMaker.name,
              docId: elemItem.reqMaker.uniqueId,
            };
          });
          return elem;
        });

        req.user.notificationsCount = 0;
        req.user.markModified("notificationCount");
        req.user
          .save()
          .then(() => {
            res.json({
              proposedTrades: req.user.trades,
              tradeRequests: requests,
            });
          })
          .catch((err) => {
            console.error("Error while saving user data: ", err);
            res.status(500).send("Failed to save user data").end();
          });
      })
      .catch((err) => {
        console.error(
          "Error happened while fetching item trade requests: ",
          err
        );
        res.status(500).send("Failed to fetch item trade requests!").end();
      });
  });

  app.post("/api/removeitemrequest", isLoggedIn, (req, res) => {
    const key = req.body.id;
    Item.findOne({ key: parseInt(key, 10) })
      .then((doc) => {
        User.findOne({ _id: doc.itemOwnerId })
          .then((userDoc) => {
            userDoc.notificationsCount -= 1;
            userDoc.markModified("notificationsCount");
            return userDoc.save();
          })
          .catch((err) => {
            console.log(
              "Some error happened while updating user notifications count-",
              err
            );
          });

        doc.itemRequests = doc.itemRequests.filter(
          (elem) => elem.reqMaker.id !== req.user._id.toString()
        );
        return doc.save();
      })
      .then(() => {
        req.user.trades = req.user.trades.filter((elem) => elem.id !== key);
        req.user.markModified("trades");
        return req.user.save();
      })
      .then(() => {
        res.json({ proposedTrades: req.user.trades });
      })
      .catch((err) => {
        console.log("Some error happened while removing item request-", err);
        res.status(500).send("Some error happened while removing item request");
      });
  });

  app.post("/api/declinerequest", isLoggedIn, (req, res) => {
    // first remove itemRequest = require(item
    let userId, reqStatus;

    Item.findOne({ key: parseInt(req.body.key, 10) })
      .then((doc) => {
        doc.itemRequests = doc.itemRequests.filter((elem) => {
          if (elem.reqMaker.uniqueId.toString() === req.body.docId) {
            userId = elem.reqMaker.id;
            reqStatus = elem.reqStatus;
            return false;
          } else {
            return true;
          }
        });

        if (reqStatus === "PENDING") {
          return doc.save();
        } else {
          throw new Error("Accepted trade requests can't be declined");
        }
      })
      .then(() => User.findOne({ _id: userId }))
      .then((userDoc) => {
        userDoc.trades = userDoc.trades.filter(
          (elem) => elem.id !== req.body.key
        );
        return userDoc.save();
      })
      .then(() => {
        res.json({ status: "OK" });
      })
      .catch((err) => {
        console.log("Error happened while declining trade request!", err);
        res
          .status(500)
          .send("Error happened while declining trade request!")
          .end();
      });
  });

  app.post("/api/acceptrequest", isLoggedIn, (req, res) => {
    const { key, docId } = req.body;
    let userId, prevReqStatus;
    Item.findOne({ key: parseInt(key, 10) })
      .then((doc) => {
        doc.itemRequests = doc.itemRequests.map((elem) => {
          if (elem.reqMaker.uniqueId.toString() === docId) {
            userId = elem.reqMaker.id;
            prevReqStatus = elem.reqStatus;
            elem.reqStatus = "ACCEPTED";
          }
          return elem;
        });
        doc.markModified("itemRequests");
        if (prevReqStatus === "PENDING") {
          return doc.save();
        } else {
          throw new Error("Trade request is already accepted!");
        }
      })
      .then(() => User.findOne({ _id: userId }))
      .then((userDoc) => {
        userDoc.trades = userDoc.trades.map((elem) => {
          if (elem.id === key) {
            elem.reqStatus = "ACCEPTED";
            elem.reqMakerInfo = [req.user.email, req.user.phoneNo];
          }
          return elem;
        });
        userDoc.notificationsCount += 1;
        userDoc.markModified("notificationsCount");
        userDoc.markModified("trades");
        return userDoc.save();
      })
      .then(() => {
        res.json({ status: "OK" });
      })
      .catch((err) => {
        console.log("Error happened while accepting trade request!", err);
        res
          .status(500)
          .send("Error happened while accepting trade request!")
          .end();
      });
  });
};
