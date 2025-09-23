import axios from 'axios';
import {
  responseHandler,
  getData,
  getDataWithQuery,
  postData,
  updateData,
  deleteData,
  deleteDataWithBody
} from './apiClient';

jest.mock('axios');

describe('apiClient', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('responseHandler', () => {
    it('should handle successful response', () => {
      const response = {
        data: { id: 1, name: 'Test' },
        status: 200
      };
      const result = responseHandler(response);
      expect(result).toEqual({
        data: { id: 1, name: 'Test' },
        message: undefined,
        error: undefined,
        status: 200
      });
    });

    it('should handle response with message', () => {
      const response = {
        data: { message: 'Success', data: { id: 1 } },
        status: 200
      };
      const result = responseHandler(response);
      expect(result).toEqual({
        data: { message: 'Success', data: { id: 1 } },
        message: 'Success',
        error: 'Success',
        status: 200
      });
    });

    it('should handle response with error', () => {
      const response = {
        data: { error: 'Error occurred' },
        status: 400
      };
      const result = responseHandler(response);
      expect(result).toEqual({
        data: { error: 'Error occurred' },
        message: undefined,
        error: 'Error occurred',
        status: 400
      });
    });
  });

  describe('getData', () => {
    it('should make GET request without id', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getData('/api/test');

      expect(axios.get).toHaveBeenCalledWith('/api/test');
      expect(result).toEqual({
        data: { id: 1, name: 'Test' },
        message: undefined,
        error: undefined,
        status: 200
      });
    });

    it('should make GET request with id', async () => {
      const mockResponse = {
        data: { id: 1, name: 'Test' },
        status: 200
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getData('/api/test', 1);

      expect(axios.get).toHaveBeenCalledWith('/api/test', {
        params: { id: 1 }
      });
      expect(result).toEqual({
        data: { id: 1, name: 'Test' },
        message: undefined,
        error: undefined,
        status: 200
      });
    });
  });

  describe('getDataWithQuery', () => {
    it('should make GET request with queries', async () => {
      const mockResponse = {
        data: { results: [] },
        status: 200
      };
      axios.get.mockResolvedValue(mockResponse);

      const queries = { page: 1, limit: 10 };
      const result = await getDataWithQuery('/api/test', queries);

      expect(axios.get).toHaveBeenCalledWith('/api/test', {
        params: queries
      });
      expect(result).toEqual({
        data: { results: [] },
        message: undefined,
        error: undefined,
        status: 200
      });
    });

    it('should make GET request without queries', async () => {
      const mockResponse = {
        data: { results: [] },
        status: 200
      };
      axios.get.mockResolvedValue(mockResponse);

      const result = await getDataWithQuery('/api/test');

      expect(axios.get).toHaveBeenCalledWith('/api/test', {
        params: {}
      });
      expect(result).toEqual({
        data: { results: [] },
        message: undefined,
        error: undefined,
        status: 200
      });
    });
  });

  describe('postData', () => {
    it('should make POST request', async () => {
      const mockResponse = {
        data: { id: 1, message: 'Created' },
        status: 201
      };
      axios.post.mockResolvedValue(mockResponse);

      const body = { name: 'Test' };
      const result = await postData('/api/test', body);

      expect(axios.post).toHaveBeenCalledWith('/api/test', body, {});
      expect(result).toEqual({
        data: { id: 1, message: 'Created' },
        message: 'Created',
        error: 'Created',
        status: 201
      });
    });

    it('should make POST request with config', async () => {
      const mockResponse = {
        data: { id: 1 },
        status: 201
      };
      axios.post.mockResolvedValue(mockResponse);

      const body = { name: 'Test' };
      const config = { headers: { Authorization: 'Bearer token' } };
      const result = await postData('/api/test', body, config);

      expect(axios.post).toHaveBeenCalledWith('/api/test', body, config);
      expect(result).toEqual({
        data: { id: 1 },
        message: undefined,
        error: undefined,
        status: 201
      });
    });
  });

  describe('updateData', () => {
    it('should make PUT request', async () => {
      const mockResponse = {
        data: { id: 1, message: 'Updated' },
        status: 200
      };
      axios.put.mockResolvedValue(mockResponse);

      const body = { name: 'Updated Test' };
      const result = await updateData('/api/test', body);

      expect(axios.put).toHaveBeenCalledWith('/api/test', body, {});
      expect(result).toEqual({
        data: { id: 1, message: 'Updated' },
        message: 'Updated',
        error: 'Updated',
        status: 200
      });
    });
  });

  describe('deleteData', () => {
    it('should make DELETE request with id', async () => {
      const mockResponse = {
        data: { message: 'Deleted' },
        status: 200
      };
      axios.delete.mockResolvedValue(mockResponse);

      const result = await deleteData('/api/test', 1);

      expect(axios.delete).toHaveBeenCalledWith('/api/test', {
        params: { id: 1 }
      });
      expect(result).toEqual({
        data: { message: 'Deleted' },
        message: 'Deleted',
        error: 'Deleted',
        status: 200
      });
    });
  });

  describe('deleteDataWithBody', () => {
    it('should make DELETE request with body', async () => {
      const mockResponse = {
        data: { message: 'Deleted' },
        status: 200
      };
      axios.delete.mockResolvedValue(mockResponse);

      const body = { ids: [1, 2, 3] };
      const result = await deleteDataWithBody('/api/test', body);

      expect(axios.delete).toHaveBeenCalledWith('/api/test', {
        data: body
      });
      expect(result).toEqual({
        data: { message: 'Deleted' },
        message: 'Deleted',
        error: 'Deleted',
        status: 200
      });
    });
  });
});