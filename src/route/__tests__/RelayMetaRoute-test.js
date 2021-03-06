/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+relay
 */

'use strict';

describe('RelayMetaRoute', () => {
  var RelayMetaRoute;

  beforeEach(() => {
    jest.resetModuleRegistry();

    RelayMetaRoute = require('RelayMetaRoute');
  });

  it('is immutable', () => {
    var route = new RelayMetaRoute('TestRoute');
    expect(() => route.name = 'foo').toThrow();
  });

  it('returns caches objects when using `get`', () => {
    expect(
      RelayMetaRoute.get('TestRoute')
    ).toBe(RelayMetaRoute.get('TestRoute'));

    expect(
      RelayMetaRoute.get('TestRoute')
    ).not.toBe(RelayMetaRoute.get('TestRoute2'));

    expect(
      RelayMetaRoute.get('TestRoute2')
    ).toBe(RelayMetaRoute.get('TestRoute2'));
  });

});
