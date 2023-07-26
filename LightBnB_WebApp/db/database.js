const properties = require("./json/properties.json");
const users = require("./json/users.json");
const { Pool } = require('pg');


/// Users


// Replace these with your actual database credentials
const pool = new Pool({
  user: 'labber',
  host: 'localhost',
  database: 'lightbnb',
  password: 'labber',
  port: 5432, // Replace this with your actual database port
});

pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {console.log(response)})

module.exports = {
  query: (text, params) => pool.query(text, params),
};
/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const promise = pool
  .query(
    `SELECT * FROM users
    WHERE email = $1`,
    [ email ])
  .then((res) => {
    if(!res.rows.length){
      return(null)
    }
    return res.rows[0];
    })
  .catch((err) => {
    console.log(err.message);
    });

  return promise;
}


/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const promise = pool
  .query(
    `SELECT * FROM users
    WHERE id = $1`,
    [ id ])
  .then((res) => {
    if(!res.rows.length){
      return(null)
    }
    return res.rows[0];
    })
  .catch((err) => {
    console.log(err.message);
    });

  return promise;
}

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const promise = pool
  .query("INSERT INTO users (name, email, password) \
  VALUES ($1, $2, $3)",
    [ user.name, user.email, user.password ])
  .then((res) => {
    if(!res.rows.length){
      return(null)
    }
    return res.rows[0];
    })
  .catch((err) => {
    console.log(err.message);
    });

  return promise;
}

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return getAllProperties(null, 2);
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
