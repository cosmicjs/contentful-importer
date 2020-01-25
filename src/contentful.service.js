import pluralize from "pluralize";
import showdown from "showdown";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";

function getMetafieldType(type, subtype) {
  if (
    type === "Symbol" ||
    type === "Boolean" ||
    type === "Object" ||
    type === "Location"
  ) {
    return "text";
  } else if (type === "RichText") {
    return "html-textarea";
  } else if (type === "Text") {
    return "markdown";
  } else if (type === "Number" || type === "Integer" || type === "Decimal") {
    return "number";
  } else if (type === "Date") {
    return "date";
  } else if (type === "Asset") {
    return "file";
  } else if (type === "Link" && subtype === "Asset") {
    return "file";
  } else if (type === "Link") {
    return "object";
  } else if (type === "Array") {
    return "objects";
  }
}

function parseLink(link, media) {
  if (link.sys.type === "Link" && link.sys.linkType === "Entry") {
    return {
      type: "link",
      slug: link.sys.id
    };
  } else if (link.sys.type === "Link" && link.sys.linkType === "Asset") {
    const mediaIndex = media.findIndex(mediaObject => {
      return (
        !mediaObject.failed &&
        mediaObject.media.metadata.contentfulId === link.sys.id
      );
    });

    const mediaObject = media[mediaIndex];

    return (
      mediaObject && {
        type: "media",
        name: mediaObject.media.name
      }
    );
  }
}

export class ContentfulService {
  converter;

  constructor() {
    this.converter = new showdown.Converter();
  }

  async toCosmicMedia(assets, locales) {
    const cosmicAssets = [];

    assets.forEach(asset => {
      locales.forEach(locale =>
        cosmicAssets.push(this._createMediaObject(asset, locale))
      );
    });

    return await Promise.all(cosmicAssets);
  }

  _createMediaObject(asset, locale) {
    return new Promise((resolve, reject) => {
      const { code } = locale;
      const url = asset.fields.file[code].url;
      const res = fetch(url);

      res
        .then(body => {
          return body.blob();
        })
        .then(body => {
          const originalName = asset.fields.file[code].fileName;
          const buffer = new File([body], originalName);

          resolve({
            media: buffer,
            metadata: {
              contentfulId: asset.sys.id,
              locale: locale.code,
              description: asset.fields.description[code],
              title: asset.fields.title[code],
              originalUrl: url
            }
          });
        });
    });
  }

  toCosmicObjectTypes(contentTypes) {
    const objectTypes = {
      displayFieldMap: {},
      metafieldDescriptors: {},
      contentTypes: []
    };

    objectTypes.contentTypes = contentTypes.map(type => {
      const plural = pluralize.plural(type.name);
      const singular = pluralize.singular(type.name);

      objectTypes.displayFieldMap[type.sys.id] = type.displayField;

      objectTypes.metafieldDescriptors[type.sys.id] = {
        fields: {}
      };

      const metafields = type.fields.map(field => {
        const metafield = {
          type: getMetafieldType(field.type, field.linkType),
          title: field.name,
          key: field.id,
          required: field.required
        };

        objectTypes.metafieldDescriptors[type.sys.id].fields[
          field.id
        ] = metafield;

        return metafield;
      });

      return {
        title: plural,
        singular,
        slug: type.sys.id,
        metafields
      };
    });

    return objectTypes;
  }

  toCosmicObjects(
    entries,
    locales,
    displayFieldMap,
    metafieldDescriptors,
    media
  ) {
    const cosmicObjects = [];

    entries.forEach((entry, index) => {
      const object = {
        type_slug: entry.sys.contentType.sys.id,
        slug: entry.sys.id,
        status: "draft"
      };

      locales.forEach((locale, index) => {
        const code = locale.code;
        const title = entry.fields[displayFieldMap[object.type_slug]][code];

        const metafields = [];

        Object.keys(entry.fields).forEach(key => {
          const type = metafieldDescriptors[object.type_slug].fields[key];
          const val = entry.fields[key][code];

          const metafieldObject = {
            ...type
          };

          if (type.type === "object" && val.sys) {
            metafieldObject.value = parseLink(val, media);
          } else if (type.type === "file") {
            const mediaVal = parseLink(val, media);
            if (!mediaVal) return;
            metafieldObject.value = mediaVal.name;
          } else if (type.type === "objects" && val[0] && val[0].sys) {
            metafieldObject.value = val.map(link => parseLink(link, media));
          } else if (type.type === "html-textarea") {
            if (typeof val === "object" && val.nodeType) {
              metafieldObject.value = documentToHtmlString(val);
            } else {
              metafieldObject.value = this.converter.makeHtml(val);
            }
          } else if (type.type === "text" && typeof val === "object") {
            metafieldObject.value = JSON.stringify(val);
          } else {
            metafieldObject.value = val;
          }

          metafields.push(metafieldObject);
        });

        cosmicObjects.push({
          ...object,
          title,
          metafields,
          locale: code
        });
      });
    });

    return cosmicObjects;
  }
}
