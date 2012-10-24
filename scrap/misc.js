var obj = _.pick(SchemaAttributes, this.model.simpleAttributes());

for (var key in obj) {
    var attrObj = obj[key];
    attrObj = 
}





function Schema4Schema(aJsonObject) {

            var schema = new Schema();
            var keys = Object.keys(aJsonObject);

            for (k in keys) {

                var propertyKey = keys[k];
                var propertyValue = aJsonObject[propertyKey];
                var propertyValueType = RealTypeOf(propertyValue);

                if (propertyKey == '$schema') {
                    schema.set({
                        dollarschema: propertyValue
                    });
                } else if (propertyKey == '$ref') {

                    if (JsonSchema.RESOLVE_REFS) {
                        var result = new ProxyResult();
                        ProxyRequest(propertyValue, result);

                        var parentSchema = Schema4Schema(JSON.parse(result.value));
                        return parentSchema;

                    } else {
                        schema.set({
                            dollarref: propertyValue
                        });
                    }

                } else if (propertyKey == 'extends') {

                    if (propertyValueType == TypeEnum.ARRAY) {

                        var nestedKeys = Object.keys(propertyValue);

                        for (l in nestedKeys) {
                            var nestedPropertyKey = nestedKeys[l];
                            var nestedPropertyValue = propertyValue[nestedPropertyKey];

                            var nestedSchema = Schema4Schema(nestedPropertyValue);
                            var nestedSchemaPair = new SchemaPair({
                                schema: nestedSchema
                            });

                            if (JsonSchema.MERGE_EXTS) {
                                inherit(nestedSchema, schema);
                                schema = nestedSchema;
                            } else {
                                schema.addExtension(nestedSchemaPair);
                            }

                        }
                    } else if (propertyValueType == TypeEnum.OBJECT) {
                        var parentSchema = Schema4Schema(propertyValue);

                        if (JsonSchema.MERGE_EXTS) {
                            inherit(parentSchema, schema);
                            schema = parentSchema;
                        } else {
                            var sp = new SchemaPair({
                                schema: parentSchema
                            });
                            schema.addExtension(sp);
                        }
                    } else if (propertyValueType == TypeEnum.STRING) {
                        var result = new ProxyResult();
                        ProxyRequest(propertyValue, result);

                        var parentSchema = Schema4Schema(JSON.parse(result.value));
                        if (JsonSchema.MERGE_EXTS) {
                            inherit(parentSchema, schema);
                            schema = parentSchema;
                        } else {
                            var sp = new SchemaPair({
                                schema: parentSchema
                            });
                            schema.addExtension(sp);
                        }
                    }
                } else if (propertyKey == 'required') {
                    schema.set({
                        required: propertyValue
                    });
                } else if (propertyKey == 'title') {
                    schema.set({
                        title: propertyValue
                    });
                } else if (propertyKey == 'name') {
                    schema.set({
                        name: propertyValue
                    });
                } else if (propertyKey == 'id') {
                    schema.set({
                        schemaid: propertyValue
                    });
                } else if (propertyKey == 'description') {
                    schema.set({
                        description: propertyValue
                    });
                } else if (propertyKey == 'minimum') {
                    schema.set({
                        minimum: propertyValue
                    });
                } else if (propertyKey == 'maximum') {
                    schema.set({
                        maximum: propertyValue
                    });
                } else if (propertyKey == 'minitems') {
                    schema.set({
                        minitems: propertyValue
                    });
                } else if (propertyKey == 'maxitems') {
                    schema.set({
                        maxitems: propertyValue
                    });
                } else if (propertyKey == 'properties') {

                    var nestedKeys = Object.keys(propertyValue);

                    for (l in nestedKeys) {

                        var nestedPropertyKey = nestedKeys[l];
                        var nestedPropertyValue = propertyValue[nestedPropertyKey];
                        var nestedPropertyValueType = RealTypeOf(nestedPropertyValue);

                        var nestedSchema = Schema4Schema(nestedPropertyValue);
                        var nestedSchemaPair = new SchemaPair({
                            key: nestedPropertyKey,
                            schema: nestedSchema
                        });
                        schema.addOrReplaceProperty(nestedSchemaPair);
                    }
                } else if (propertyKey == 'items') {

                    if (propertyValueType == TypeEnum.OBJECT) {

                        var nestedSchemaPair = new SchemaPair({
                            schema: Schema4Schema(propertyValue)
                        });
                        schema.addItem(nestedSchemaPair);

                    } else if (propertyValueType == TypeEnum.ARRAY) {

                        var nestedKeys = Object.keys(propertyValue);

                        for (m in nestedKeys) {
                            var nestedPropertyKey = nestedKeys[m];
                            var nestedPropertyValue = propertyValue[nestedPropertyKey];
                            var nestedPropertyValueType = RealTypeOf(nestedPropertyValue);

                            var nestedSchema = Schema4Schema(nestedPropertyValue);
                            var nestedSchemaPair = new SchemaPair({
                                schema: nestedSchema
                            });
                            schema.addItem(nestedSchemaPair);
                        }
                    }
                } else if (propertyKey == 'type') {

                    if (propertyValueType == TypeEnum.ARRAY) {

                        var nestedKeys = Object.keys(propertyValue);

                        for (n in nestedKeys) {
                            var nestedPropertyKey = nestedKeys[n];
                            var nestedPropertyValue = propertyValue[nestedPropertyKey];
                            var type = new Type({
                                t: nestedPropertyValue
                            });
                            schema.addType(type);
                        }
                    } else if (propertyValueType == TypeEnum.STRING) {
                        var type = new Type({
                            t: propertyValue
                        });
                        schema.addType(type);
                    }
               



               simpleAttributesWithVal: function() {

            var self = this;
            var keepAttributes = _.filter(this.simpleKeys(), function(key) {

                if (key === 'required') {
                    // Only show required if true
                    return key;
                }
                else if (key === 'id') {
                    // Never show
                    return false;
                }
                else if (key === 'dollarschema') {
                    // Never show
                    return false;
                }
                else {
                    return (self.attributes[key] != '');
                }
            });

            return _.pick(this.attributes, keepAttributes);
        },


        handleAddSchemaPair: function() {
            var key = undefined;
            var pSchemas = (this.className == 'Properties');
            var iSchemas = (this.className == 'Items');
            var eSchemas = (this.className == 'Extensions');
            var nestedLevel = (this.datalevel + 1);
            var first = (this.collection.length == 0);
            var second = (this.collection.length == 1);
            var tupleTyping = (second && (iSchemas || eSchemas));
            /* Schema Pair can contain nested Schema Pairs, therefore
            need to use :first. */
            var r = $(SchemaPairLV.SCHEMAS_REF, this.el).filter(':first');

            r.attr("data-level", nestedLevel);

            // Only properties have keys.
            if (pSchemas) {
                key = "RenameMe";
            }

            var sp = new SchemaPair({
                key: key,
                schema: new Schema()
            });
            this.collection.add(sp);

            if (!first) {
                // Show the previous schema delimiter.
                $(SchemaPairLV.SCHEMA_DELIMITER_REF, this.el).filter(':last').show();
            }

            spv = new SchemaPairV({
                model: sp
            });
            spv.setLevel(nestedLevel);

            /* Begining of an implementation to keep the order of SchemaPairViews 
        syncd with the Collection of SchemaPairs. */

            /* sortedIndex uses Collection comparator function, which required modify
            to ensure each item was unique. */
            // var pos = this.collection.sortedIndex(sp, this.collection.comparator);
            // var existingSpvs = $('div.Schemas > div.SchemaPairView', this.el);
            // if (pos == 0) {
            //   r.prepend(spv.render().el);
            // }
            // else if (pos == this.collection.length-1) {
            //   r.append(spv.render().el);
            //   spv.handleBeingLast();
            // }
            // else if (pos > 0) {
            //   $(existingSpvs[pos]).parent().prepend(spv.render().el);
            //   var isLast = this.collection.at(this.collection.length-1);
            //   XYZ.handleBeingLast();
            // }
            r.append(spv.render().el);
            spv.handleBeingLast();

            if (tupleTyping) {
                $(SchemaPairLV.OPENING_SYMBOL_REF, this.el).filter(':first').append("[").show();
                $(SchemaPairLV.CLOSING_SYMBOL_REF, this.el).filter(':last').append("]").show();
            }
            sp.bind('deleted:SchemaPairV', this.removeSchemaPair);
        },