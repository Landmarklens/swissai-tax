import axios from 'axios';

// Response handler for backward compatibility
// Note: Error handling is now done via axios interceptors in config/axiosConfig.js
export const responseHandler = (response) => {
  return {
    data: response.data,
    message: response.data.message,
    error: response.data.error || response.data.message,
    status: response.status
  };
};

// -------------------------------------------------------------------------//
// GET REQUEST
export const getData = async (END_POINT, id = null) => {
  let response;

  if (id) {
    response = await axios.get(END_POINT, {
      params: { id }
    });
  } else {
    // Don't set CORS headers from client - these are response headers set by server
    response = await axios.get(END_POINT);
  }
  return responseHandler(response);
};

// -------------------------------------------------------------------------//
// get request with support of query
export const getDataWithQuery = async (END_POINT, queries = {}) => {
  let response;
  if (queries) {
    response = await axios.get(END_POINT, {
      params: queries
    });
  } else {
    response = await axios.get(END_POINT);
  }
  return responseHandler(response);
};

// -------------------------------------------------------------------------//
// POST REQUEST
export const postData = async (END_POINT, body, config = {}) => {
  const response = await axios.post(END_POINT, body, config);
  return responseHandler(response);
};

// -------------------------------------------------------------------------//
// PUT REQUEST
export const updateData = async (END_POINT, body, config = {}) => {
  const response = await axios.put(END_POINT, body, config);
  return responseHandler(response);
};

// -------------------------------------------------------------------------//
// DELETE REQUEST
export const deleteData = async (END_POINT, id) => {
  const response = await axios.delete(END_POINT, {
    params: { id }
  });
  return responseHandler(response);
};

// -------------------------------------------------------------------------//
export const deleteDataWithBody = async (END_POINT, body) => {
  const response = await axios.delete(END_POINT, {
    data: body
  });
  return responseHandler(response);
};
