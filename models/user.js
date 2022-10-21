let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  second_name: { type: String, maxLength: 100 },
  username: { type: String, required: true, maxLength: 100 },
  password: { type: String, required: true },
  email: { type: String, maxLength: 100 },
  twofa_enabled: { type: Boolean, default: false },
  twofa_preferred: {
    type: String,
    enum: ["email", "authApp"],
    default: "authApp",
  },
  temp_secret: { type: Object },
  secret: { type: Object },
});

UserSchema.virtual("full_name").get(function () {
  let full_name = "";
  return (full_name = `${this.family_name}, ${this.first_name}`);
});

UserSchema.virtual("url").get(function () {
  return `/user/${this._id}`;
});

module.exports = mongoose.model("User", UserSchema);
