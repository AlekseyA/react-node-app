const AWS = require('aws-sdk');
const config = require('../config/keys');
const randomString = require('../services/randomString');

const s3 = new AWS.S3({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.awsRegion
})

module.exports = app => {
  app.get('/api/upload', (req, res) => {
    const key = `${req.user.id}/${randomString()}.jpeg`
    s3.getSignedUrl(
      'putObject',
      {
        Bucket: config.S3Bucket,
        Key: key,
        ContentType: 'image/jpeg',
        Expires: 60*60
      },
      (err, url) => res.send({key, url})
    )
  });
}