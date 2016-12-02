/**
 * Created by ka on 22/04/2016.
 */
const Promise = require("promise");
const jsonStorage = require("electron-json-storage");

exports.get = function(key)
{
    return new Promise((resolve, error) => {
        var hasProm = new Promise((fulfill, reject) => {
            jsonStorage.has(key, (err, hasKey) => {
                if (err)
                    reject(err);
                else
                    fulfill(hasKey);
            })
        })

        return hasProm.then((hasKey) => {
            if (!hasKey) {
                console.log("no such key");
                error("no such key");
            }

            jsonStorage.get(key, (err, value) => {
            if (err)
                error(err);
            else
                resolve(value);
            });
        })
    });
}

exports.set = function(key, value)
{
    return new Promise((resolve, error) => {
        jsonStorage.set(key, value, (err) => {
            if (err)
                error(err);
            else
                resolve();
        });
    });
}
