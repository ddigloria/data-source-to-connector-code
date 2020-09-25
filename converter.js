let POJOSOutput = "";
let fieldsOutput = "";
let mapperOutput = "";

function convert() {

    const jsonContent = document.getElementById("json").value;
    const jsonObject = {name: document.getElementById("mainName").value, properties: JSON.parse(jsonContent)[0]};

    POJOSOutput = "";
    fieldsOutput = "";
    mapperOutput = "";

    convertJavascriptObjectToPOJO(jsonObject, "");

    document.getElementById("pojos").value = POJOSOutput;
    document.getElementById("fieldsDef").value = fieldsOutput;
    document.getElementById("mapper").value = mapperOutput;
}

function convertJavascriptObjectToPOJO(jsonObject, flowsPropertyPrefix) {
    POJOSOutput += "public class ";
    POJOSOutput += capitalize(jsonObject.name);
    POJOSOutput += " { \n";
    let innerObjectsToUnwrap = [];
    for (let propertyName in jsonObject.properties) {
        populateOutputs(propertyName, jsonObject.properties[propertyName], innerObjectsToUnwrap, flowsPropertyPrefix)
    }
    POJOSOutput += "} \n\n";

    flowsPropertyPrefix = jsonObject.name + capitalize(flowsPropertyPrefix);

    for (let property of innerObjectsToUnwrap) {
        property.name = jsonObject.name + capitalize(property.name);
        convertJavascriptObjectToPOJO(property, flowsPropertyPrefix);
    }
}

function singularize(word) {
    const language = document.getElementById("language").value;
    switch (language) {
        case "EN" :
        default :
            return singularizeEN(word)
    }
}

function singularizeEN(word) {
    return pluralize.singular(word);
}


function generateFlowField(field, type) {
    const fieldName = convertCamelCaseToSentence(field);
    fieldsOutput += `
    fields.add(
        OperationalConnectorFlowField.newBuilder()
            .id("${field}")
            .name("${fieldName}")
            .type(DataType.${type})
            .build()
    );\n`
}

function convertCamelCaseToSentence(string) {
    return string.replace(/([A-Z])/g, " $1").toLowerCase();
}

function generateMapperLine(key, valueCode) {
    mapperOutput += `map.put("${key}",${valueCode});\n`;
}

function populateOutputs(name, property, innerObjectsToUnwrap, flowsPropertyPrefix) {
    let attribute = "private final ";
    let type = property == null ? "String" : typeof property;
    let isArray = Array.isArray(property);
    console.log(type);
    if (isArray) {
        name = singularize(name);
        attribute += "List<";
    }

    if (type === "object") {
        attribute += capitalize(name);
        if (isArray) {
            innerObjectsToUnwrap.push(new Object({
                name: name,
                properties: property[0]
            }))
        } else {
            innerObjectsToUnwrap.push(new Object({name: name, properties: property}));
        }
    } else {

        attribute += "String";
        const prefixedName = flowsPropertyPrefix !== "" ? flowsPropertyPrefix + capitalize(name) : name;
        generateMapperLine(name, keyCode);
        switch (type) {
            case 'boolean' : {
                generateFlowField(prefixedName, "BOOLEAN");
            }
                break;
            case 'number' : {
                generateFlowField(prefixedName, "NUMBER");
            }
                break;
            default : {
                generateFlowField(prefixedName, "TEXT");
            }
        }
    }


    if (isArray) {
        attribute += ">";
    }

    attribute += " " + name + ";\n";
    POJOSOutput += attribute;
}

const capitalize = (s) => {
    if (typeof s !== 'string') return ''
    return s.charAt(0).toUpperCase() + s.slice(1)
}