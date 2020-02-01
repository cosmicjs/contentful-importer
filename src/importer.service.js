export class ImporterService {
  contentful;
  cosmic;

  constructor(contentfulService, cosmicService) {
    this.contentful = contentfulService;
    this.cosmic = cosmicService;
  }

  loadContentfulContent(file, onProgress, onError, onComplete, onMessage) {
    const reader = new FileReader();

    reader.readAsText(file, "UTF-8");

    reader.onload = e => {
      try {
        const content = e.target.result;

        const json = JSON.parse(content);

        this._parseContent(json, onProgress, onError, onComplete, onMessage);
      } catch (e) {
        onError(e);
      }
    };
  }

  async _parseContent(content, onProgress, onError, onComplete, onMessage) {
    try {
      this._validateContent(content);

      onProgress("Content valid. Parsing...");

      const fields = this.contentful.toCosmicObjectTypes(content.contentTypes);

      onProgress("Successfully parsed content types");

      await this.cosmic.addObjectTypes(fields.contentTypes);

      onProgress("Successfully created content types");

      const media = (
        await this.contentful.toCosmicMedia(content.assets, content.locales)
      ).filter(mediaObject => {
        if (mediaObject.failed) {
          onMessage(
            `Failed to download image from contentful: ${mediaObject.title}`
          );

          return false;
        }

        return true;
      });

      onProgress("Successfully parsed media");

      onProgress("Uploading media to Cosmic...");

      const cosmicMedia = await this.cosmic.addMediaObjects(media);

      const successfulMedia = cosmicMedia.filter(media => {
        if (media.failed) {
          onMessage(
            `Failed to upload image: ${media.file.metadata.title} - ${media.file.metadata.originalUrl}`
          );

          return false;
        }

        return true;
      });

      onProgress("Successfully created media");

      const parsedObjects = this.contentful.toCosmicObjects(
        content.entries,
        content.locales,
        fields.displayFieldMap,
        fields.metafieldDescriptors,
        successfulMedia
      );

      onProgress("Successfully parsed entries");

      await this.cosmic.addObjects(parsedObjects);

      onProgress("Successfully created objects");

      onComplete();
    } catch (e) {
      onError(e);
      console.log(e);
    }
  }

  _validateContent(content) {
    if (
      !content ||
      !content.contentTypes ||
      !content.entries ||
      !content.locales
    ) {
      throw new Error("invalid content");
    }
  }
}
