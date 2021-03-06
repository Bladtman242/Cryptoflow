const _ = require("lodash");
const encode = require("./encode");
const parseInnardsToFunction = require("./innardsParsing/stringToFunction");
const doBlockCalculation = require("./doBlockCalculation");
const blockRenderer = require("./blockRenderer");
const innardsRenderer = require("./innardsRenderer/renderer");

module.exports = (config) => {
    let inputs = config.inputs.map((inputName) => { return { name: inputName, value: generateRandomDefaultValue() }; });
    let changeListeners = [];

    let onBlockChange = (cb) => changeListeners.push(cb);
    let notifyChanged = () => changeListeners.forEach((listener) => listener());

    let setValue = (name, value) => {
        let input = inputs.find((input) => input.name == name);
        if(input) input.value = value;
        else console.warn(`Tried to set ${name} to ${value}, but ${name} does not exist on the block ${config.name} (${config.id})`);
        notifyChanged();
    }

    let output = { name: "output", value: null };
    
    let outputListeners = [];
    let onOutputChange = (cb) => {
        outputListeners.push(cb);
    };

    let notifyOutputChanged = () => outputListeners.forEach((listener) => listener());

    let setOutput = (value) => {
        output.value = value;
        notifyOutputChanged();
    };

    let block = _.defaults({ inputs, setValue, output, onOutputChange }, config);
    block.func = parseInnardsToFunction(block);

    block.render = blockRenderer(block, onBlockChange, onOutputChange, notifyChanged);

    block.renderInnards = innardsRenderer(block);

    onBlockChange(() => doBlockCalculation(block).then(result => setOutput(result)));

    return block;
};

function generateRandomDefaultValue() {
    //TODO: We want to replace this! With something crypto-random. 
    //      But both node and browser support is needed.
    let result = [];
    for(let i = 0; i < 6; i++) {
        result.push(Math.round(Math.random() * 255));
    }
    return result;
}
