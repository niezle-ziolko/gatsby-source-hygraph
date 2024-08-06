"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginOptionsSchema = void 0;


function pluginOptionsSchema(args) {
  const { Joi } = args;
  return Joi.object({
    assetsPath: Joi.string()
      .description(`The local project name folder where generated query assets are saved.`),
    fragmentsPath: Joi.string()
      .description(`The local project name folder where generated query fragments are saved.`),
    allowedTypes: Joi.array()
      .items(Joi.string())
      .description('A list of allowed types for which fragments should be generated. If not set, all available types will be used.'),
  });
};

exports.pluginOptionsSchema = pluginOptionsSchema;