const assert = require('assert');

function testIndexOf() {
  const result = [1, 2, 3].indexOf(4);
  try {
    assert.equal(result, -1);
    console.log('testIndexOf passed');
  } catch (error) {
    console.error('testIndexOf failed');
  }
}

testIndexOf();