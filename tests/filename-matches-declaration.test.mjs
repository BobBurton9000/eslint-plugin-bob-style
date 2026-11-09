import assert from 'node:assert/strict';
import test from 'node:test';
import bobStyle from '../dist/index.js';

const rule = bobStyle.rules['filename-matches-declaration'];

test('uses context.filename without the legacy getFilename API', () => {
    const reports = [];
    const listeners = rule.create({
        filename: '/project/Actual.ts',
        report: (message) => reports.push(message),
    });

    listeners.ExportNamedDeclaration({
        declaration: {
            type: 'ClassDeclaration',
            id: { name: 'Expected' },
        },
    });

    assert.equal(reports.length, 1);
    assert.equal(reports[0].messageId, 'filenameMatchesDeclaration');
    assert.deepEqual(reports[0].data, {
        fileName: 'Actual',
        declarationName: 'Expected',
    });
});
