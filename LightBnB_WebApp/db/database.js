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
  const queryString = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;
  const params = [guest_id, limit];
  return pool.query(queryString, params)
    .then(res => res.rows);
}


/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  let queryString = 
  "SELECT properties.*, AVG(property_reviews.rating) AS average_rating, count(property_reviews.rating) as review_count\
  FROM properties\
  JOIN property_reviews ON properties.id = property_reviews.property_id\
  "

  if(options.city || options.owner_id || options.minimum_price_per_night && options.maximum_price_per_night){
    queryString += 'WHERE'
  }

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    if(options.city) {
      queryString +=  `AND`
    }
    queryParams.push(`${options.owner_id}`);
    queryString +=  ` owner_id = $${queryParams.length} `;
  }


  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    if(options.city || options.owner_id){
      queryString +=  `AND`
    }
    let minPrice = options.minimum_price_per_night * 100
    let maxPrice = options.maximum_price_per_night * 100

    queryParams.push(`${minPrice}`);
    queryParams.push(`${maxPrice}`);

    queryString += ` (properties.cost_per_night > $${queryParams.length-1} AND properties.cost_per_night < $${queryParams.length})`;
  }

  queryString += ' GROUP BY properties.id'

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING AVG(property_reviews.rating) >= $${queryParams.length} `;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  return pool
    .query(
      queryString,
      queryParams)
    .then((result) => {
      return result.rows;
      })
    .catch((err) => {
      console.log(err.message);
      });
}

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryParams = [
    property.owner_id, 
    property.title, 
    property.description, 
    property.thumbnail_photo_url, 
    property.cover_photo_url, 
    property.cost_per_night, 
    property.street, 
    property.city,
    property.province, 
    property.post_code, 
    property.country, 
    property.parking_spaces, 
    property.number_of_bathrooms, 
    property.number_of_bedrooms];

  let queryString = 
  "INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces,\ number_of_bathrooms, number_of_bedrooms)\
  VALUES ($1, $5, $6, $4, $8, $6, $9, $8, $13, $12, $10, $9, $11, $3)\
  RETURNING *;"

  return pool
    .query(
      queryString,
      queryParams)
    .then((result) => {
      return result.rows;W
      })
    .catch((err) => {
      console.log(err.message);
      });
}

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
