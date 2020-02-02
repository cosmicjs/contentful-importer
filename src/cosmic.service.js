import CosmicFactory from "cosmicjs";

export class CosmicService {
  bucket;

  constructor(slug, read_key, write_key) {
    const Cosmic = CosmicFactory();

    this.bucket = Cosmic.bucket({
      slug,
      read_key,
      write_key
    });
  }

  addMediaObjects(media) {
    try {
      const promises = media.map(media => this.addMediaObject(media));
      return Promise.all(promises);
    } catch (e) {
      console.log("caught at add media object", e);

      throw e;
    }
  }

  addMediaObject(params) {
    return new Promise((resolve, reject) => {
      this.bucket
        .addMedia(params)
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          resolve({ failed: true, e: err, file: params });
        });
    });
  }

  addObjects(objectArr) {
    const promises = objectArr.map(object => this.addObject(object));

    return Promise.all(promises);
  }

  addObject(params) {
    return new Promise((resolve, reject) => {
      this.bucket
        .addObject(params)
        .then(data => resolve(data))
        .catch(err => {
          if (err.message && !err.message.includes("already exists")) {
            reject(err);
          }

          resolve(err);
        });
    });
  }

  addObjectTypes(typeArr) {
    const promises = typeArr.map(type => this.addObjectType(type));

    return Promise.all(promises);
  }

  addObjectType(params) {
    return new Promise((resolve, reject) => {
      this.bucket
        .addObjectType(params)
        .then(data => resolve(data))
        .catch(err => {
          if (err.message && !err.message.includes("already exists")) {
            reject(err);
          }

          resolve(err);
        });
    });
  }
}
