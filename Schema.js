var Backbone = require("backbone");
var _ = require("underscore");
var Models = require("./Models");
var utility = require("./Utility");
var util = require("util");

var Type = Models.Type;
var TypeList = Models.TypeList;

// Namespace.
var JsonSchema = new function() {

    StateEnum = {
        COMPLETE: 0
    }

    function inherit(parent, child) {

        // Copy simple attributes that have a value, from child into parent.
        parent.set(child.simpleAttributesWithVal());

        /* Copy all complex attributes from child into parent.
        Array will be empty if there are no values. */
        parent.addItem(_.toArray(child.get('items')));
        parent.addExtension(_.toArray(child.get('extensions')));
        parent.addOrReplaceProperties(_.toArray(child.get('properties')));
        parent.addTypes(_.toArray(child.get('type')));
    }

    function Schema4Schema(aJsonObject) {

        var schema = new Schema();
        var keys = Object.keys(aJsonObject);
        var state = undefined;

        for (k in keys) {
            var attributeKey = keys[k];
            var attributeValue = aJsonObject[attributeKey];
            var isComplexAttribute = (_.indexOf(schema.complexSchemaKeys(), attributeKey) >= 0);

            if (isComplexAttribute) {
                state = schema4ComplexAttr(schema, attributeValue, attributeKey);
            } else {
                state = schema4SimpleAttr(schema, attributeValue, attributeKey);
            }

            if (StateEnum.COMPLETE == state) {
                break;
            }
        }
        return schema;
    }

    function schema4ComplexAttr(aSchema, aAttributeValue, aAttributeKey) {

        if (aAttributeKey == '$ref') {
            return refAttr(aSchema, aAttributeValue);
        } else if (aAttributeKey == 'extends') {
            return extensionAttr(aSchema, aAttributeValue);
        } else if (aAttributeKey == 'items') {
            return itemsAttr(aSchema, aAttributeValue);
        } else if (aAttributeKey == 'type') {
            return typesAttr(aSchema, aAttributeValue);
        } else if (aAttributeKey == 'properties') {
            return propertiesAttr(aSchema, aAttributeValue);
        }
    }

    function refAttr(aSchema, aAttributeValue) {

        if (JsonSchema.RESOLVE_REFS) {
            var result = new ProxyResult();
            ProxyRequest(aAttributeValue, result);
            var referencedSchema = Schema4Schema(JSON.parse(result.value));
            // $ref replaces everything.
            _.extend(aSchema, referencedSchema);
            // So we need to stop any further passing of schema attributes.
            return StateEnum.COMPLETE;
        } else {
            schema4SimpleAttr(aSchema, aAttributeValue, '$ref');
        }
    }

    function extensionAttr(aSchema, aAttributeValue) {
        var attributeValueType = utility.RealTypeOf(aAttributeValue);

        if (attributeValueType == utility.TypeEnum.OBJECT) {
            var parentSchema = Schema4Schema(aAttributeValue);

            if (JsonSchema.MERGE_EXTS) {
                inherit(parentSchema, aSchema);
                _.extend(aSchema, parentSchema);
            } else {
                var sp = new SchemaPair({
                    schema: parentSchema
                });
                aSchema.addExtension(sp);
            }
        } else if (attributeValueType == utility.TypeEnum.ARRAY) {
            var nestedKeys = Object.keys(aAttributeValue);

            for (l in nestedKeys) {
                var nestedAttrKey = nestedKeys[l];
                var nestedAttrValue = aAttributeValue[nestedAttrKey];

                var nestedSchema = Schema4Schema(nestedAttrValue);
                var nestedSchemaPair = new SchemaPair({
                    schema: nestedSchema
                });

                if (JsonSchema.MERGE_EXTS) {
                    inherit(nestedSchema, schema);
                    return nestedSchema;
                } else {
                    aSchema.addExtension(nestedSchemaPair);
                }
            }
        }
    }

    function itemsAttr(aSchema, aAttributeValue) {

        var attributeValueType = utility.RealTypeOf(aAttributeValue);

        if (attributeValueType == utility.TypeEnum.OBJECT) {

            var nestedSchemaPair = new SchemaPair({
                schema: Schema4Schema(aAttributeValue)
            });
            aSchema.addItem(nestedSchemaPair);

        } else if (attributeValueType == utility.TypeEnum.ARRAY) {

            var nestedKeys = Object.keys(aAttributeValue);

            for (m in nestedKeys) {
                var nestedAttrKey = nestedKeys[m];
                var nestedAttrValue = aAttributeValue[nestedAttrKey];
                var nestedAttrValueType = utility.RealTypeOf(nestedAttrValue);

                var nestedSchema = Schema4Schema(nestedAttrValue);
                var nestedSchemaPair = new SchemaPair({
                    schema: nestedSchema
                });
                aSchema.addItem(nestedSchemaPair);
            }
        }
    }

    function typesAttr(aSchema, aAttributeValue) {
        var attributeValueType = utility.RealTypeOf(aAttributeValue);

        if (attributeValueType == utility.TypeEnum.ARRAY) {

            var nestedKeys = Object.keys(aAttributeValue);

            for (n in nestedKeys) {
                var nestedAttrKey = nestedKeys[n];
                var nestedAttrValue = aAttributeValue[nestedAttrKey];
                var type = new Type({
                    t: nestedAttrValue
                });
                aSchema.addType(type);
            }
        } else if (attributeValueType == utility.TypeEnum.STRING) {
            var type = new Type({
                t: aAttributeValue
            });
            aSchema.addType(type);
        }
    }

    function propertiesAttr(aSchema, aAttributeValue) {

        var nestedKeys = Object.keys(aAttributeValue);

        for (l in nestedKeys) {

            var nestedPropertyKey = nestedKeys[l];
            var nestedPropertyValue = aAttributeValue[nestedPropertyKey];
            var nestedPropertyValueType = utility.RealTypeOf(nestedPropertyValue);

            var nestedSchema = Schema4Schema(nestedPropertyValue);
            var nestedSchemaPair = new SchemaPair({
                key: nestedPropertyKey,
                schema: nestedSchema
            });
            aSchema.addOrReplaceProperty(nestedSchemaPair);
        }
    }

    function schema4SimpleAttr(aSchema, aValue, aKey) {

        if (aKey == '$schema') {
            aSchema.set({
                dollarschema: aValue
            });
        } else if (aKey == '$ref') {
            aSchema.set({
                dollarref: aValue
            });
        } else if (aKey == 'required') {
            aSchema.set({
                required: aValue
            });
        } else if (aKey == 'title') {
            aSchema.set({
                title: aValue
            });
        } else if (aKey == 'name') {
            aSchema.set({
                name: aValue
            });
        } else if (aKey == 'id') {
            aSchema.set({
                id: aValue
            });
        } else if (aKey == 'description') {
            aSchema.set({
                description: aValue
            });
        } else if (aKey == 'minimum') {
            aSchema.set({
                minimum: aValue
            });
        } else if (aKey == 'maximum') {
            aSchema.set({
                maximum: aValue
            });
        } else if (aKey == 'minitems') {
            aSchema.set({
                minitems: aValue
            });
        } else if (aKey == 'maxitems') {
            aSchema.set({
                maxitems: aValue
            });
        }
    }


    function Schema4Object(aJsonObject) {

        var objectType = new Type({
            t: utility.TypeEnum.OBJECT
        });
        var schema = new Schema();
        schema.addType(objectType);

        var keys = Object.keys(aJsonObject);

        for (k in keys) {
            var propertyKey = keys[k];
            var propertyValue = aJsonObject[propertyKey];
            var propertyValueType = utility.RealTypeOf(propertyValue);

            var propertySchema = null;
            var propertySchemaPair = null;

            if (propertyValueType == utility.TypeEnum.OBJECT) {
                propertySchema = Schema4Object(propertyValue);

            } else if (propertyValueType == utility.TypeEnum.ARRAY) {
                propertySchema = Schema4Array(propertyValue);

            } else {
                propertySchema = Schema4Value(propertyValue);
            }

            propertySchemaPair = new SchemaPair({
                key: propertyKey,
                schema: propertySchema
            });
            schema.addProperty(propertySchemaPair);
        }
        return schema;
    }

    function Schema4Value(aJsonValue) {
        var valueType = utility.RealTypeOf(aJsonValue);
        var type = new Type({
            t: valueType
        });
        var schema = new Schema();
        schema.addType(type);

        if (JsonSchema.INCLUDE_DEFS) {
            schema.set({
                defaultValue: aJsonValue
            });
        }
        return schema;
    }

    function Schema4Array(aJsonArray) {

        var schema = new Schema();
        var type = new Type({
            t: utility.TypeEnum.ARRAY
        });
        schema.addType(type);

        var keys = Object.keys(aJsonArray);
        var existingSchemaItems = new Array();
        var itemSchemaPairs = new Array();
        var doTupleTyping = false;
        var firstKey = true;

        for (k in keys) {
            var propertyKey = keys[k];
            var propertyValue = aJsonArray[propertyKey];
            var propertyValueType = utility.RealTypeOf(propertyValue);

            var itemSchema;

            if (propertyValueType == utility.TypeEnum.OBJECT) {
                itemSchema = Schema4Object(propertyValue);
            } else {
                itemSchema = Schema4Value(propertyValue);
            }

            var itemSchemaPair = new SchemaPair({
                schema: itemSchema
            });
            itemSchemaPairs.push(itemSchemaPair);

            var schemaAsJsonString = JSON.stringify(itemSchema.toJSON());
            var duplicateSchema = (_.indexOf(existingSchemaItems, schemaAsJsonString) >= 0);

            if (!duplicateSchema) {
                existingSchemaItems.push(schemaAsJsonString);
            }
            // If more than one unique schema is required for this array, then we need all schemas. 
            doTupleTyping = (!duplicateSchema && !firstKey);
            firstKey = false;
        }

        if (doTupleTyping) {
            schema.addItems(itemSchemaPairs);
        } else {
            // All items can be represented with same schema, so just use first.
            schema.addItem(itemSchemaPairs[0]);
        }
        return schema;
    }


    // ---------- Public Objects ---------- //
    this.GenerateSchema = function() {

        var schemaVersion = 'http://json-schema.org/draft-03/schema';
        console.log(process.argv[1])
        var jsonObject = JSON.parse(process.argv[2]);
        var schema = null;


        if (JsonSchema.INPUT_MODE == 'schema') {
            schema = Schema4Schema(jsonObject);
        } else {
            schema = Schema4Object(jsonObject);
            schema.set({
                dollarschema: schemaVersion
            });
        }
        return schema;
    }
};

exports.JsonSchema=JsonSchema;
var uncouthSchema = JSON.stringify(JsonSchema.GenerateSchema(), undefined, 2);
// What this is doing: RAD STUFF!!!
console.log(uncouthSchema.replace(/\n[ \t\s]*"[^"]*": "",/g, ''));