/**
 * Test Helper - Setup and Utilities for Observatory Tests
 * 
 * This file provides common utilities and setup for all tests.
 */

import { expect } from 'chai';
import sinon from 'sinon';

// Global test setup
before(() => {
  // Suppress logger output during tests
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
});

// Global test teardown
after(() => {
  // Cleanup
});

// Export commonly used testing utilities
export {
  expect,
  sinon
};

// Mock database pool for testing
export function createMockPool() {
  const queryStub = sinon.stub();
  const poolStub = {
    query: queryStub,
    connect: sinon.stub(),
    end: sinon.stub()
  };
  
  return { poolStub, queryStub };
}

// Mock Express request
export function createMockRequest(overrides = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    path: '/',
    method: 'GET',
    ip: '127.0.0.1',
    ...overrides
  };
}

// Mock Express response
export function createMockResponse() {
  const res = {
    statusCode: 200,
    status: sinon.stub(),
    json: sinon.stub(),
    send: sinon.stub(),
    setHeader: sinon.stub()
  };
  
  res.status.returns(res);
  res.json.returns(res);
  res.send.returns(res);
  
  return res;
}

// Mock Express next function
export function createMockNext() {
  return sinon.stub();
}

// Helper to wait for async operations
export function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to assert that a function throws a specific error
export function expectToThrow(fn, errorMessage) {
  try {
    fn();
    throw new Error('Expected function to throw but it did not');
  } catch (err) {
    expect(err.message).to.include(errorMessage);
  }
}

// Helper to assert async function throws
export async function expectAsyncToThrow(fn, errorMessage) {
  try {
    await fn();
    throw new Error('Expected async function to throw but it did not');
  } catch (err) {
    expect(err.message).to.include(errorMessage);
  }
}
