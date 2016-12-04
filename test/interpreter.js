'use strict';

let c = require('../src/dsl');
let interpreter = require('../src/interpreter');
let {
    map
} = require('bolzano');

let assert = require('assert');

let {
    v, r, getJson
} = c;

let log = (v) => { // eslint-disable-line
    console.log(JSON.stringify(v)); // eslint-disable-line
    return v;
};

describe('interpreter', () => {
    it('base', () => {
        let add = c.require('add');
        let run = interpreter({
            add: (x, y) => x + y
        });
        assert.equal(
            run(
                getJson(
                    r('x', add(1, v('x')))(3)
                )
            ), 4);
    });

    it('same name', () => {
        let add = c.require('add');
        let sub = c.require('sub');
        let run = interpreter({
            add: (x, y) => x + y,
            sub: (x, y) => x - y
        });

        // (x, y, z) => ((x, y) => x + y)(y, z) - x
        let e = r('x', 'y', 'z',
            sub(
                r('x', 'y',
                    add(v('x'), v('y'))
                )(v('y'), v('z')),
                v('x')
            )
        );

        assert.equal(
            run(
                getJson(
                    e(5, 4, 3)
                )
            ), 2);

        assert.equal(
            run(
                getJson(
                    e(1, 4, 3)
                )
            ), 6);
    });

    it('handler', () => {
        let com = c.require('com');
        let add = c.require('add');
        let run = interpreter({
            com: (f, x) => f(x),
            add: (x, y) => x + y
        });

        assert.equal(
            run(
                getJson(
                    com(r('x', add(v('x'), 1)), 10)
                )
            ), 11);
    });

    it('map handler', () => {
        let add = c.require('add');
        let myMap = c.require('myMap');
        let run = interpreter({
            add: (x, y) => x + y,
            myMap: map
        });

        assert.deepEqual(
            run(
                getJson(
                    myMap([1, 2, 3], r('x', add(v('x'), 1)))
                )
            ), [2, 3, 4]);
    });

    it('parent context', () => {
        let add = c.require('add');
        let run = interpreter({
            add: (x, y) => x + y
        });

        assert.deepEqual(
            run(
                getJson(
                    r('x',
                        r('y', add(v('x'), v('y')))(7)
                    )(10)
                )
            ), 17);
    });

    it('error variable', () => {
        let add = c.require('add');
        let run = interpreter({
            add: (x, y) => x + y
        });

        try {
            run(
                getJson(
                    r('x',
                        add(v('y'), 1)
                    )(10)
                )
            );

            assert.equal(true, false);
        } catch (err) {
            assert.equal(err.toString().indexOf('undefined variable y') !== -1, true);
        }
    });

    it('unexpected type', () => {
        let run = interpreter({
            add: (x, y) => x + y
        });

        try {
            run(
                ['k']
            );

            assert.equal(true, false);
        } catch (err) {
            assert.equal(err.toString().indexOf('unexpected type k') !== -1, true);
        }
    });
});
