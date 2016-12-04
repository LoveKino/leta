'use strict';

let c = require('../src/dsl');

let assert = require('assert');

let {
    v, r, getJson
} = c;

describe('dsl', () => {
    it('base', () => {
        assert.deepEqual(getJson(
            v('x')
        ), ['v', 'x']);

        let add = c.require('add');
        assert.deepEqual(getJson(
            add(1, v('x'))
        ), ['p', 'add', [
            ['d', 1],
            ['v', 'x']
        ]]);

        assert.deepEqual(getJson(
            r('x', add(1, v('x')))
        ), ['l', ['x'],
            ['p', 'add', [
                ['d', 1],
                ['v', 'x']
            ]]
        ]);
    });

    it('apply', () => {
        let add = c.require('add');

        assert.deepEqual(getJson(
            r('x', add(1, v('x')))(3)
        ), [
            'a', [
                'l', ['x'],
                ['p', 'add', [
                    ['d', 1],
                    ['v', 'x']
                ]]
            ],
            [
                ['d', 3]
            ]
        ]);

        assert.deepEqual(getJson(
            r('x', v('x'))(r('y', v('y')))
        ), [
            'a', [
                'l', ['x'],
                ['v', 'x']
            ],
            [
                ['l', ['y'],
                    ['v', 'y']
                ]
            ]
        ]);
    });
});
