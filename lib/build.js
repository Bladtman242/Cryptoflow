const browserify = require("browserify");
const fs = require("fs");
const path = require("path");
const cryptoflow = require("./src/index");
const mustache = require("mustache");
const async = require("async");
const _site = path.join(__dirname, "..", "_site");
const _templates = path.join(__dirname, "src", "_templates");

module.exports = (callback) => {
    //TODO: Remove _site folder and rebuild
    fs.mkdir(_site, (error) => {
        if(error && error.code !== "EEXIST") {
            return callback(error);
        }

        let b = browserify();
        b.add(path.join(__dirname, "src", "index.js"));

        let pipe = b.bundle().pipe(fs.createWriteStream(path.join(_site, "cryptoflow.js")));
        let failed = false;
        pipe.once("error", (error) => {
            failed = true;
            callback(error);
        });
        pipe.once("finish", () => {
            if(failed) {
                return;
            }

            fs.readFile(path.join(_templates, "default.html"), "utf8", (error, defaultTemplate) => {
                if(error) {
                    return callback(error);
                }
                fs.readFile(path.join(_templates, "block.html"), "utf8", (error, blockTemplateRaw) => {
                    if(error) {
                        return callback(error);
                    }

                    let blockTemplate = mustache.render(defaultTemplate, { content: blockTemplateRaw });
            
                    fs.mkdir(path.join(_site, "blocks"), (error) => {
                        if(error && error.code !== "EEXIST") {
                            return callback(error);
                        }

                        async.each(Object.keys(cryptoflow.blocks), (blockName, callback) => {
                            let block = cryptoflow.blocks[blockName];
                            let html = mustache.render(blockTemplate, block);
                            let blockId = getIdFromName(block.name);
                            let blockPath = path.join(_site, "blocks", blockId);

                            fs.mkdir(blockPath, (error) => {
                                if(error && error.code !== "EEXIST") {
                                    return callback(error);
                                }
                                fs.writeFile(path.join(blockPath, "index.html"), html, callback);
                            });
                        }, (error) => {
                            if(error) {
                                return callback(error);
                            }
                            fs.readFile(path.join(_templates, "index.html"), "utf8", (error, indexTemplateRaw) => {
                                if(error) {
                                    return callback(error);
                                }

                                let indexTemplate = mustache.render(defaultTemplate, { content: indexTemplateRaw });

                                let indexHtml = mustache.render(indexTemplate, {
                                    blocks: Object.keys(cryptoflow.blocks).map((blockName) => { let block = cryptoflow.blocks[blockName]; return { id: getIdFromName(block.name), name: block.name }; })
                                });
                                fs.writeFile(path.join(_site, "index.html"), indexHtml, (error) => {
                                    if(error) {
                                        return callback(error);
                                    }
                                    
                                    callback();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

function getIdFromName(name) {
    return name; //TODO
}