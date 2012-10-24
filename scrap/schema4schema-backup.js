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
                }
            }
            return schema;
        }