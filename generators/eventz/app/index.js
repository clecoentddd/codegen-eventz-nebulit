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
            this.globalConfig = require(this.env.cwd + '/config.json');
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
                default: this.globalConfig?.codeGen?.application || 'my-app'
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
            (slice.commands || []).forEach((command) => {
                const commandType = commandTitle(command);
                const destinationDir = `app/src/slices/${pascalCase(slice.title)}`;
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

                this.fs.copyTpl(this.templatePath('specific-command.ts.tpl'), this.destinationPath(`${destinationDir}/${commandType}Command.ts`), { commandPayload: renderCommandPayload(command), commandType: commandType });
                this.fs.copyTpl(this.templatePath('decider.ts.tpl'), this.destinationPath(`${destinationDir}/${commandType}Decider.ts`), { commandType, eventImports, eventUnion, resultingEvents: renderedEvents });
                this.fs.copyTpl(this.templatePath('command-handler.ts.tpl'), this.destinationPath(`${destinationDir}/${commandType}CommandHandler.ts`), { commandType });
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
                this.destinationPath(`app/src/components/${commandType}UI.tsx`),
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

            // Generate slice page
            const commandUIs = (slice.commands || []).map(command => {
                const commandType = commandTitle(command);
                return `<${commandType}UI />`;
            }).join('\n            ');

            const commandImports = (slice.commands || []).map(command => {
                const commandType = commandTitle(command);
                return `import { ${commandType}UI } from '../app/src/components/${commandType}UI';`;
            }).join('\n');

            this.fs.copyTpl(
                this.templatePath('page.tsx.tpl'),
                this.destinationPath(`pages/${sliceSlug}.tsx`),
                {
                    sliceName,
                    sliceTitle: slice.title,
                    commandUIs,
                    commandImports
                }
            );
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
