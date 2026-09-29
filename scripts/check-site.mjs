import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();

const siteDir = path.join(projectRoot, 'site');
const indexPath = path.join(siteDir, 'index.html');

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exitCode = 1;
}

async function exists(filePath) {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

if (!(await exists(indexPath))) {
    fail("Файл не найден index.html");
} else {
    console.log("Файл index.html найден");
    const html = await readFile(indexPath, 'utf-8');
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1]?.trim();

    if (!title) {
        fail("Тег <title> не найден в index.html");
    } else {
        console.log(`Тег <title> найден: "${title}"`);
    }

    const reference = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]).filter((value) => !/^(?:https?:|mailto:|tel:|#|data:)/i.test(value));
    const missing = [];

    for (const ref of reference) {
        const cleanReference = ref.split(/[?#]/, 1)[0];

        const resolved = path.resolve(siteDir, cleanReference.replace(/^\//, ''));

        if (!(await exists(resolved))) {
            missing.push(reference);
        }

        if (missing.length > 0) {
            fail(`Отсутствуют следующие файлы: ${missing.join(', ')}`);
        } else {
            console.log("Все ссылки в index.html корректны");
        }
    }
}

if (!process.exitCode) {
    console.log("Проверка завершена успешно");
}