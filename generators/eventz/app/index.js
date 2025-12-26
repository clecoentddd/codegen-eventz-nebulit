/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator');
var slugify = require('slugify');

// --- Helper Functions ---

function pascalCase(title) {
    if (!title) return '';
    return slugify(title)
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^[a-z]/, (m) => m.toUpperCase());
}

function eventTitle(event) {
    return pascalCase(event.title);
}

function commandTitle(command) {
    return pascalCase(command.title);
}

function tsType(field) {
    const typeMap = { uuid: 'string', string: 'string', double: 'number', decimal: 'number', int: 'number', integer: 'number', boolean: 'boolean', custom: 'any', date: 'Date', datetime: 'Date' };
    const baseType = typeMap[field.type.toLowerCase()] || 'any';
    const isList = field.cardinality && field.cardinality.toLowerCase() === 'list';
    return isList ? `Array<${baseType}>` : baseType;
}

function renderEvent(event) {
    const typeName = eventTitle(event);
    const fields = event.fields || [];
    const fieldStrings = fields.map(f => `    ${f.name}: ${tsType(f)}`).join(';\n');
    const eventNameConst = `export const ${typeName}EventName = '${typeName}';`;
    const eventType = `export type ${typeName} = Event<typeof ${typeName}EventName, {\n${fieldStrings}\n}>;`;
    return `${eventNameConst}\n\n${eventType}`;
}

function renderCommandPayload(command) {
    const typeName = commandTitle(command);
    const fields = command.fields || [];
    if (!fields || fields.length === 0) {
        return `export type ${typeName}CommandPayload = {};`;
    }
    const fieldStrings = fields.map(f => `    ${f.name}: ${tsType(f)};`).join('\n');
    return `export type ${typeName}CommandPayload = {\n${fieldStrings}\n};`;
}

function renderEventAssignment(event) {
    const eventFields = event.fields || [];
    const typeName = eventTitle(event);
    return `{\n        streamId: command.streamId,\n        type: ${typeName}EventName,\n        data: {\n            ${eventFields.map(field => `${field.name}: command.data.${field.name}`).join(',\n            ')}\n        },\n        metadata: {\n            correlation_id: command.metadata?.correlation_id,\n            causation_id: command.metadata?.causation_id\n        }\n    }`;
}

// --- Main Generator Class ---

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.log('Eventz Generator: Constructor starting...');
        try {
            const config = require(this.env.cwd + '/config.json');
            // Handle both formats: config as object with slices, or config as slices array
            if (Array.isArray(config)) {
                this.globalConfig = { slices: config };
            } else {
                this.globalConfig = config;
            }
        } catch (e) {
            this.env.error('FATAL ERROR: config.json not found or is invalid.');
        }
    }

    async prompting() {
        this.log('Eventz Generator: Prompting phase starting...');
        this.answers = await this.prompt([
            {
                type: 'input',
                name: 'appName',
                message: 'What is the name of your project?',
                default: 'my-app'
            },
            {
                type: 'confirm',
                name: 'setupSupabase',
                message: 'Do you want to set up Supabase for event persistence?',
                default: false
            }
        ]);
        this.log('Eventz Generator: Prompting phase finished.');
    }

    writing() {
        this.log('Eventz Generator: Writing phase starting...');
        this.destinationRoot(this.destinationPath(this.answers.appName));
        this._writeNextJsScaffolding();
        this._writingEvents();
        this._writingCommands();
        this._writeRegistry();
        this._writeNextApiRoutes();
        this._writeUIComponents();
        this._writeProjections();
        this._writeReadmodelAPIs();
        if (this.answers.setupSupabase) {
            this._writeSupabaseSetup();
        }
        this._cleanupOldFiles();
    }

    _cleanupOldFiles() {
        this.log('---> _cleanupOldFiles: Removing old Express.js files if they exist...');
        const filesToDelete = ['app/src/api.ts', 'app/src/run.ts', 'app/src/index.ts'];
        filesToDelete.forEach(file => {
            const filePath = this.destinationPath(file);
            if (this.fs.exists(filePath)) {
                this.fs.delete(filePath);
                this.log(`       - Deleted ${file}`);
            }
        });
    }

    _getHttpMethodForCommand(commandTitle) {
        const title = commandTitle.toLowerCase();
        if (title.startsWith('create')) return 'POST';
        if (title.startsWith('update')) return 'PUT';
        if (title.startsWith('delete')) return 'DELETE';
        if (title.startsWith('get')) return 'GET';
        if (title.startsWith('list')) return 'GET';
        return 'POST'; // Default to POST
    }

    _writeNextJsScaffolding() {
        this.log('---> _writeNextJsScaffolding: Scaffolding Next.js application skeleton...');
        this.fs.copyTpl(this.templatePath('package.json.tpl'), this.destinationPath('package.json'), { appName: this.answers.appName });
        this.fs.copy(this.templatePath('tsconfig.json.tpl'), this.destinationPath('tsconfig.json'));
        this.fs.copy(this.templatePath('next-env.d.ts.tpl'), this.destinationPath('next-env.d.ts'));
        this.fs.copy(this.templatePath('index.tsx.tpl'), this.destinationPath('pages/index.tsx'));
        this.fs.write(this.destinationPath('public/.gitkeep'), '');
        this.fs.write(this.destinationPath('pages/api/.gitkeep'), '');

        const domainDir = 'app/src/common/domain';
        this.fs.copy(this.templatePath('Event.ts.tpl'), this.destinationPath(`${domainDir}/Event.ts`));
        this.fs.copy(this.templatePath('Command.ts.tpl'), this.destinationPath(`${domainDir}/Command.ts`));
        this.fs.copy(this.templatePath('EventStore.ts.tpl'), this.destinationPath(`${domainDir}/EventStore.ts`));
        const infraDir = 'app/src/common/infrastructure';
        this.fs.copy(this.templatePath('messageBus.ts.tpl'), this.destinationPath(`${infraDir}/messageBus.ts`));

        // Create components directory
        this.fs.write(this.destinationPath('app/src/components/.gitkeep'), '');
    }

    _writingEvents() {
        const slices = this.globalConfig.slices || [];
        if (slices.length === 0) return;
        const eventsDir = 'app/src/events';
        this.fs.write(this.destinationPath(`${eventsDir}/.gitkeep`), '');
        slices.forEach((slice) => {
            (slice.events || []).filter(ev => ev.title && ev.context !== 'EXTERNAL').forEach((ev) => {
                const fileName = `${eventTitle(ev)}.ts`;
                const destinationPath = `${eventsDir}/${fileName}`;
                const fileContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { Event } from '../common/domain/Event';\n\n${renderEvent(ev)}\n`;
                this.fs.write(this.destinationPath(destinationPath), fileContent);
            });
        });
    }

    _writingCommands() {
        const slices = this.globalConfig.slices || [];
        if (slices.length === 0) return;

        slices.forEach((slice) => {
            const sliceName = pascalCase(slice.title);
            const sliceDir = `app/src/slices/${sliceName}`;
            this.fs.write(this.destinationPath(`${sliceDir}/.gitkeep`), '');

            (slice.commands || []).forEach((command) => {
                const commandType = commandTitle(command);
                const resultingEvents = (command.dependencies || [])
                    .filter(dep => dep.type === 'OUTBOUND' && dep.elementType === 'EVENT')
                    .map(dep => (this.globalConfig.slices || []).flatMap(s => s.events).find(ev => ev.id === dep.id))
                    .filter(Boolean);
                const eventImports = resultingEvents.map(event => {
                    const title = eventTitle(event);
                    return `import { ${title}, ${title}EventName } from '../../events/${title}';`;
                }).join('\n');
                const eventUnion = resultingEvents.map(event => eventTitle(event)).join(' | ') || 'never';
                const renderedEvents = resultingEvents.map(event => renderEventAssignment(event)).join(',\n');

                this.fs.copyTpl(this.templatePath('specific-command.ts.tpl'), this.destinationPath(`${sliceDir}/${commandType}Command.ts`), { commandPayload: renderCommandPayload(command), commandType: commandType });
                this.fs.copyTpl(this.templatePath('decider.ts.tpl'), this.destinationPath(`${sliceDir}/${commandType}Decider.ts`), { commandType, eventImports, eventUnion, resultingEvents: renderedEvents });
                this.fs.copyTpl(this.templatePath('command-handler.ts.tpl'), this.destinationPath(`${sliceDir}/${commandType}CommandHandler.ts`), { commandType });
            });
        });
    }
    
    _writeRegistry() {
        this.log('---> _writeRegistry: Generating command handler registry...');
        const slices = this.globalConfig.slices || [];
        const commandHandlerImports = [];
        const commandHandlerRegistrations = [];

        slices.forEach(slice => {
            (slice.commands || []).forEach(command => {
                const commandType = commandTitle(command);
                const sliceName = pascalCase(slice.title);
                const handlerCreator = `create${commandType}CommandHandler`;
                const handlerPath = `./slices/${sliceName}/${commandType}CommandHandler`;

                commandHandlerImports.push(`import { ${handlerCreator} } from '${handlerPath}';`);
                const registration = `    messageBus.subscribe('${commandType}', ${handlerCreator}(eventStore));`;
                commandHandlerRegistrations.push(registration);
            });
        });

        this.fs.copyTpl(
            this.templatePath('registry.ts.tpl'),
            this.destinationPath('app/src/registry.ts'),
            {
                setupSupabase: this.answers.setupSupabase,
                commandHandlerImports: commandHandlerImports.join('\n'),
                commandHandlerRegistrations: commandHandlerRegistrations.join('\n')
            }
        );
    }

    _writeNextApiRoutes() {
        this.log('---> _writeNextApiRoutes: Generating Next.js API routes...');
        const slices = this.globalConfig.slices || [];

        const initContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { initialize } from '../../app/src/registry';\n\nlet isInitialized = false;\n\nexport function ensureInitialized() {\n    if (!isInitialized) {\n        initialize();\n        isInitialized = true;\n        console.log('[API] Command bus initialized.');\n    }\n}`;
        this.fs.write(this.destinationPath('pages/api/initializer.ts'), initContent);

        slices.forEach(slice => {
            (slice.commands || []).forEach(command => {
                const commandType = commandTitle(command);
                const commandSlug = slugify(command.title).toLowerCase();
                const sliceName = pascalCase(slice.title);
                const commandPath = `../../app/src/slices/${sliceName}/${commandType}Command`;
                const httpMethod = this._getHttpMethodForCommand(command.title);
                const requiredFields = command.fields || [];
                const commandPayload = requiredFields.map(f => {
                    if (f.generated && f.type.toLowerCase() === 'uuid') {
                        return `${f.name}: randomUUID()`;
                    } else {
                        return `${f.name}: req.body.${f.name}`;
                    }
                }).join(',\n                    ');

                this.fs.copyTpl(
                    this.templatePath('next-api-route.ts.tpl'),
                    this.destinationPath(`pages/api/${commandSlug}.ts`),
                    {
                        commandType,
                        commandPath,
                        httpMethod,
                        commandPayload
                    }
                );
            });
        });
    }

    _writeUIComponents() {
        this.log('---> _writeUIComponents: Generating UI components for state change...');
        const slices = this.globalConfig.slices || [];

        slices.forEach(slice => {
            const sliceName = pascalCase(slice.title);
            const sliceSlug = slugify(slice.title.replace(/^slice:/i, '')).toLowerCase();

            // Create ui directory for the slice
            this.fs.write(this.destinationPath(`app/src/slices/${sliceName}/ui/.gitkeep`), '');

            // Generate command UI components
            (slice.commands || []).forEach(command => {
                const commandType = commandTitle(command);
                const commandSlug = slugify(command.title).toLowerCase();
                const requiredFields = command.fields || [];

                const nonGeneratedFields = requiredFields.filter(
                    f => !(f.generated && f.type.toLowerCase() === 'uuid')
                    );

                const formFields = nonGeneratedFields.map(f => {
                    const fieldType = f.type.toLowerCase() === 'string' ? 'text' : f.type.toLowerCase();
                    return `                <div>
                        <label htmlFor="${f.name}">${f.name}:</label>
                        <input
                            type="${fieldType}"
                            id="${f.name}"
                            name="${f.name}"
                            value={formData.${f.name}}
                            onChange={handleChange}
                            required
                        />
                    </div>`;
                }).join('\n');

               const commandPayload = nonGeneratedFields
                .map(f => `${f.name}: ${tsType(f)}`)
                .join('; ');

                const commandPayloadDefaults = nonGeneratedFields.length
                    ? `{ ${nonGeneratedFields.map(f => `${f.name}: ''`).join(', ')} }`
                    : '{}';

                this.fs.copyTpl(
                this.templatePath('commandUI.tsx.tpl'),
                this.destinationPath(`app/src/slices/${sliceName}/ui/${commandType}UI.tsx`),
                {
                    commandType,
                    commandSlug,
                    commandTitle: command.title,
                    commandPayload: commandPayload || 'any',
                    commandPayloadDefaults: commandPayloadDefaults || '',
                    formFields
                }
                );
            });

            // Generate screen components for STATE_VIEW slices
            let screenUIs = '';
            let screenImports = '';
            if (slice.sliceType === 'STATE_VIEW') {
                (slice.screens || []).forEach(screen => {
                    const screenSlug = slugify(screen.title).toLowerCase();
                    const readmodelDeps = (screen.dependencies || [])
                        .filter(dep => dep.type === 'INBOUND' && dep.elementType === 'READMODEL')
                        .map(dep => (this.globalConfig.slices || []).flatMap(s => s.readmodels).find(rm => rm.id === dep.id))
                        .filter(Boolean);

                    if (readmodelDeps.length > 0) {
                        const readmodel = readmodelDeps[0]; // Assume one readmodel per screen
                        const apiSlug = slugify(readmodel.title).toLowerCase();
                        const screenName = pascalCase(screen.title);

                        this.fs.copyTpl(this.templatePath('screen.tsx.tpl'), this.destinationPath(`app/src/slices/${sliceName}/ui/${screenName}.tsx`), {
                            screenName,
                            screenTitle: screen.title,
                            apiSlug
                        });

                        screenUIs += `<${screenName} />\n            `;
                        screenImports += `import ${screenName} from '../app/src/slices/${sliceName}/ui/${screenName}';\n`;
                    }
                });
            }

            // Generate slice page only if there are commands or screens
            if ((slice.commands || []).length > 0 || screenUIs) {
                const commandUIs = (slice.commands || []).map(command => {
                    const commandType = commandTitle(command);
                    return `<${commandType}UI />`;
                }).join('\n            ');

                const commandImports = (slice.commands || []).map(command => {
                    const commandType = commandTitle(command);
                    return `import { ${commandType}UI } from '../app/src/slices/${sliceName}/ui/${commandType}UI';`;
                }).join('\n');

                const allUIs = [commandUIs, screenUIs].filter(Boolean).join('\n            ');
                const allImports = [commandImports, screenImports].filter(Boolean).join('\n');

                this.fs.copyTpl(
                    this.templatePath('page.tsx.tpl'),
                    this.destinationPath(`pages/${sliceSlug}.tsx`),
                    {
                        sliceName,
                        sliceTitle: slice.title,
                        commandUIs: allUIs,
                        commandImports: allImports
                    }
                );
            }
        });

        // Update index page with slice links
        const sliceLinks = slices.map(slice => {
            const sliceSlug = slugify(slice.title.replace(/^slice:/i, '')).toLowerCase();
            return `<Link href="/${sliceSlug}"><a>${slice.title}</a></Link>`;
        }).join('\n                    ');

        this.fs.copyTpl(
            this.templatePath('index.tsx.tpl'),
            this.destinationPath('pages/index.tsx'),
            {
                sliceLinks
            }
        );
    }

    _writeProjections() {
        this.log('---> _writeProjections: Generating projection files for readmodels...');
        const slices = this.globalConfig.slices || [];
        slices.filter(slice => slice.sliceType === 'STATE_VIEW').forEach(slice => {
            const sliceName = pascalCase(slice.title);
            const sliceDir = `app/src/slices/${sliceName}`;
            this.fs.write(this.destinationPath(`${sliceDir}/.gitkeep`), '');

            (slice.readmodels || []).forEach(readmodel => {
                const readmodelName = pascalCase(readmodel.title);
                const projectionName = `projection${readmodelName}`;
                const fileName = `${projectionName}.ts`;
                const destinationPath = `${sliceDir}/${fileName}`;
                const fields = readmodel.fields || [];
                const fieldStrings = fields.map(f => `    ${f.name}: ${tsType(f)};`).join('\n');

                // Find inbound events
                const inboundEvents = (readmodel.dependencies || [])
                    .filter(dep => dep.type === 'INBOUND' && dep.elementType === 'EVENT')
                    .map(dep => (this.globalConfig.slices || []).flatMap(s => s.events).find(ev => ev.id === dep.id))
                    .filter(Boolean);

                const eventImports = inboundEvents.map(event => {
                    const title = eventTitle(event);
                    return `import { ${title}, ${title}EventName } from '../../events/${title}';`;
                }).join('\n');

                const eventsList = inboundEvents.map(event => `${eventTitle(event)}EventName`).join(', ');

                // Simple evolve function for live projection
                const evolveCases = inboundEvents.map(event => {
                    const eventType = eventTitle(event); // e.g., CustomerCreated
                    const eventFields = event.fields || [];

                    const assignments = eventFields
                        .map(field => `        ${field.name}: (event.data as any).${field.name},`)
                        .join('\n');

                    return `if (event.type === ${eventType}EventName) {\n    return {\n${assignments}\n    };\n}`;
                }).join('\n');


                this.fs.copyTpl(this.templatePath('readmodel.ts.tpl'), this.destinationPath(destinationPath), {
                    readmodelName,
                    fieldStrings,
                    eventImports,
                    eventsList,
                    evolveCases
                });
            });
        });
    }

    _writeReadmodelAPIs() {
        this.log('---> _writeReadmodelAPIs: Generating Next.js API routes for readmodels...');
        const slices = this.globalConfig.slices || [];
        slices.filter(slice => slice.sliceType === 'STATE_VIEW').forEach(slice => {
            const sliceName = pascalCase(slice.title);
            (slice.readmodels || []).forEach(readmodel => {
                const readmodelName = pascalCase(readmodel.title);
                const projectionName = `projection${readmodelName}`;
                const apiSlug = slugify(readmodel.title).toLowerCase();
                const apiContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { NextApiRequest, NextApiResponse } from 'next';\nimport { get${readmodelName}Projection } from '../../app/src/slices/${sliceName}/${projectionName}';\n\nexport default async function handler(req: NextApiRequest, res: NextApiResponse) {\n    if (req.method !== 'GET') {\n        return res.status(405).json({ message: 'Method not allowed' });\n    }\n    try {\n        const data = await get${readmodelName}Projection();\n        return res.status(200).json(data);\n    } catch (error) {\n        console.error(error);\n        return res.status(500).json({ message: 'Internal server error' });\n    }\n}`;

                this.fs.write(this.destinationPath(`pages/api/${apiSlug}.ts`), apiContent);
            });
        });
    }

    _writeScreenPages() {
        this.log('---> _writeScreenPages: Generating pages for screens...');
        const slices = this.globalConfig.slices || [];
        slices.filter(slice => slice.sliceType === 'STATE_VIEW').forEach(slice => {
            (slice.screens || []).forEach(screen => {
                const screenSlug = slugify(screen.title).toLowerCase();
                const readmodelDeps = (screen.dependencies || [])
                    .filter(dep => dep.type === 'INBOUND' && dep.elementType === 'READMODEL')
                    .map(dep => (this.globalConfig.slices || []).flatMap(s => s.readmodels).find(rm => rm.id === dep.id))
                    .filter(Boolean);

                if (readmodelDeps.length > 0) {
                    const readmodel = readmodelDeps[0]; // Assume one readmodel per screen
                    const apiSlug = slugify(readmodel.title).toLowerCase();
                    const screenName = pascalCase(screen.title);

                    this.fs.copyTpl(this.templatePath('screen.tsx.tpl'), this.destinationPath(`pages/${screenSlug}.tsx`), {
                        screenName,
                        screenTitle: screen.title,
                        apiSlug
                    });
                }
            });
        });

        // Update index page with screen links
        const screenLinks = slices.filter(slice => slice.sliceType === 'STATE_VIEW').flatMap(slice =>
            (slice.screens || []).map(screen => {
                const screenSlug = slugify(screen.title).toLowerCase();
                return `<Link href="/${screenSlug}"><a>${screen.title}</a></Link>`;
            })
        ).join('\n                    ');

        const currentIndexContent = this.fs.read(this.destinationPath('pages/index.tsx'));
        const updatedIndexContent = currentIndexContent.replace(
            /(<Link href="\/[^"]+"><a>[^<]+<\/a><\/Link>\n                    )+/g,
            `$&${screenLinks}\n                    `
        );
        this.fs.write(this.destinationPath('pages/index.tsx'), updatedIndexContent);
    }

    _writeSupabaseSetup() {
        this.log('---> _writeSupabaseSetup: Creating Supabase files...');
        const envPath = this.destinationPath('.env.local');
        if (this.fs.exists(envPath)) {
            this.log('WARNING: .env.local already exists. Please ensure it contains the required Supabase variables.');
        } else {
            this.fs.copy(this.templatePath('.env.example.tpl'), envPath);
        }
        this.fs.copy(this.templatePath('SupabaseEventStore.ts.tpl'), this.destinationPath('app/src/infrastructure/persistence/SupabaseEventStore.ts'));
        this.fs.copy(this.templatePath('create_events_table.sql.tpl'), this.destinationPath('migrations/create_events_table.sql'));
    }

    end() {
        this.log('=======================================================');
        this.log('Eventz Generator: All tasks finished. Job is Done!');
        this.log('=======================================================');
    }
};
