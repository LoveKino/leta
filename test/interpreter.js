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

    it('map predicate', () => {
        let addOne = c.require('addOne');
        let myMap = c.require('myMap');
        let run = interpreter({
            addOne: (x) => x + 1,
            myMap: map
        });

        assert.deepEqual(
            run(
                getJson(
                    myMap([1, 2, 3], addOne)
                )
            ), [2, 3, 4]);
    });

    it('predicate as variable', () => {
        let addOne = c.require('addOne');
        let id = c.require('id');
        let run = interpreter({
            addOne: (x) => x + 1,
            id: v => v
        });

        assert.deepEqual(
            run(
                getJson(
                    id(addOne)(2)
                )
            ), 3);
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
            assert.equal(err.toString().indexOf('unexpected expression type k') !== -1, true);
        }
    });

    it('misssing predicate', () => {
        let run = interpreter({});

        let add = c.require('add');

        try {
            run(
                getJson(
                    add(2, 3)
                )
            );

            assert.equal(true, false);
        } catch (err) {
            assert.equal(err.toString().indexOf('missing predicate add') !== -1, true);
        }
    });

    it('misssing predicate', () => {
        let run = interpreter({});

        try {
            run(
                [
                    'a', [
                        'd', 3,
                    ],
                    [
                        ['d', 1]
                    ]
                ]
            );

            assert.equal(true, false);
        } catch (err) {
            assert.equal(err.toString().indexOf('expected function') !== -1, true);
        }
    });

    it('missing predicate', () => {
        let addOne = c.require('addOne');
        let myMap = c.require('myMap');
        let run = interpreter({
            myMap: map
        });

        try {
            run(
                getJson(
                    myMap([1, 2, 3], addOne)
                )
            );
            assert.equal(true, false);
        } catch (err) {
            assert.equal(err.toString().indexOf('missing predicate add') !== -1, true);
        }
    });

    it('high order function', () => {
        let run = interpreter({
            add: (x, y) => x + y
        });

        let add = c.require('add');

        assert.equal(
            run(
                getJson(
                    r('x', r('y', add(v('x'), v('y'))))(3)(4)
                )
            ), 7
        );
    });

    it('map path', () => {
        let run = interpreter({
            math: {
                add: (x, y) => x + y
            }
        });

        let add = c.require('math.add');

        assert.equal(
            run(
                getJson(
                    add(3, 4)
                )
            ), 7
        );
    });

    it('get function', () => {
        let run = interpreter({
            getMath: () => {
                return {
                    add: (x, y) => x + y
                };
            },
            get: (m, k) => {
                return m[k];
            }
        });

        let getMath = c.require('getMath');
        let get = c.require('get');

        assert.equal(
            run(
                getJson(
                    get(getMath(), 'add')(3, 4)
                )
            ), 7
        );
    });
});
