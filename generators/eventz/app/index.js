// @ts-nocheck
/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var GeneratorModule = require("yeoman-generator");
var Generator = GeneratorModule.default || GeneratorModule;
var slugify = require("slugify");

// --- Helper Functions ---

function pascalCase(title) {
  if (!title) return "";
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
  const typeMap = {
    uuid: "string",
    string: "string",
    double: "number",
    decimal: "number",
    int: "number",
    integer: "number",
    boolean: "boolean",
    custom: "any",
    date: "Date",
    datetime: "Date",
  };
  
  let baseType;
  
  // Handle Custom types with subfields
  if (field.type.toLowerCase() === "custom" && field.subfields && field.subfields.length > 0) {
    const subfieldTypes = field.subfields.map(subfield => {
      const subType = typeMap[subfield.type.toLowerCase()] || "any";
      const subIsList = subfield.cardinality && subfield.cardinality.toLowerCase() === "list";
      const finalSubType = subIsList ? `Array<${subType}>` : subType;
      return `${subfield.name}: ${finalSubType}`;
    }).join("; ");
    baseType = `{ ${subfieldTypes} }`;
  } else {
    baseType = typeMap[field.type.toLowerCase()] || "any";
  }
  
  const isList =
    field.cardinality && field.cardinality.toLowerCase() === "list";
  return isList ? `Array<${baseType}>` : baseType;
}

function renderEvent(event) {
  const typeName = eventTitle(event);
  const fields = event.fields || [];
  const fieldStrings = fields
    .map((f) => `    ${f.name}: ${tsType(f)}`)
    .join(";\n");
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
  const fieldStrings = fields
    .map((f) => `    ${f.name}: ${tsType(f)};`)
    .join("\n");
  return `export type ${typeName}CommandPayload = {\n${fieldStrings}\n};`;
}

function renderCommandPayloadFields(command) {
  const fields = command.fields || [];
  if (!fields || fields.length === 0) {
    return "";
  }
  return fields.map((f) => `    ${f.name}: ${tsType(f)};`).join("\n");
}

function renderEventAssignment(event) {
  const eventFields = event.fields || [];
  const typeName = eventTitle(event);
  const dataFields = eventFields
    .map((field) => {
      return `${field.name}: command.data.${field.name}`;
    })
    .join(",\n            ");
  return `{\n        streamId: ONE_STREAM_ONLY,\n        type: ${typeName}EventName,\n        data: {\n            ${dataFields}\n        },\n        metadata: {\n            correlation_id: command.metadata?.correlation_id,\n            causation_id: command.metadata?.causation_id\n        }\n    }`;
}

// @ts-ignore
function generateFormFields(allFields, readmodelApiUrl, forScreen = false, readmodelFields = []) {
  // Find idAttribute field (connection/group field) dynamically
  const idAttributeField = allFields.find(f => f.idAttribute && f.type === 'UUID');
  const listField = readmodelFields.find(f => f.type === 'Custom' && f.subfields && f.subfields.length > 0);
  const hasDynamicMapping = idAttributeField && listField;
  
  return allFields
    .map((f) => {
      const fieldName = f.name;
      const isGeneratedByUser = f.generated === true;
      const isIdAttribute = f.idAttribute === true;
      
      // idAttribute UUID fields should be dropdowns populated from readmodel data
      if (isIdAttribute && f.type === 'UUID' && readmodelApiUrl) {
        return (
          "                {readmodelLoading ? (\n" +
          "                  <div className=\"text-sm text-slate-500\">Loading connections...</div>\n" +
          "                ) : (\n" +
          "                  <Select\n" +
          '                    label="' + (f.name.charAt(0).toUpperCase() + f.name.slice(1)) + '"\n' +
          '                    id="' + fieldName + '"\n' +
          '                    name="' + fieldName + '"\n' +
          "                    value={formData." + fieldName + "}\n" +
          "                    onChange={handleChange}\n" +
          "                    required\n" +
          "                    options={readmodelData.map(item => ({\n" +
          "                      value: item." + fieldName + ",\n" +
          "                      label: item." + fieldName + "\n" +
          "                    }))}\n" +
          "                  />\n" +
          "                )}\n"
        );
      }
      
      // Skip read-only fields (not generated by user and not idAttribute)
      const shouldBeReadOnly = forScreen ? !isGeneratedByUser && !isIdAttribute : isGeneratedByUser;
      
      if (shouldBeReadOnly && !isIdAttribute) {
        // Skip read-only custom/complex fields in forms
        if (f.type === 'Custom') {
          return '';
        }
        const fieldType = f.type.toLowerCase() === "string" ? "text" : f.type.toLowerCase();
        return (
          "                <TextInput\n" +
          '                    label="' + fieldName + ' (auto-generated)"\n' +
          '                    type="' + fieldType + '"\n' +
          '                    id="' + fieldName + '"\n' +
          '                    name="' + fieldName + '"\n' +
          "                    value={formData['" + fieldName + "']}\n" +
          "                    onChange={handleChange}\n" +
          "                    readOnly\n" +
          "                    disabled\n" +
          "                />\n"
        );
      }
      
      // If field has mapping attribute and we have dynamic filtering capability
      if (f.mapping && hasDynamicMapping) {
        // Find ID and name/label fields in the list subfields
        const idSubfield = listField.subfields.find(sf => 
          sf.name.toLowerCase().includes('id') || sf.type === 'UUID'
        )?.name || listField.subfields[0]?.name || 'id';
        
        const nameSubfield = listField.subfields.find(sf => 
          sf.name.toLowerCase().includes('nom') || 
          sf.name.toLowerCase().includes('name') || 
          sf.type === 'String'
        )?.name || listField.subfields[1]?.name || 'name';
        
        return (
          "                {formData." + idAttributeField.name + " && availableItems.length > 0 ? (\n" +
          "                  <Select\n" +
          '                    label="' + (f.name.charAt(0).toUpperCase() + f.name.slice(1)) + '"\n' +
          '                    id="' + fieldName + '"\n' +
          '                    name="' + fieldName + '"\n' +
          "                    value={formData." + fieldName + "}\n" +
          "                    onChange={handleChange}\n" +
          "                    required\n" +
          "                    options={availableItems.map(item => ({\n" +
          "                      value: item." + idSubfield + ",\n" +
          "                      label: item." + nameSubfield + "\n" +
          "                    }))}\n" +
          "                  />\n" +
          "                ) : (\n" +
          "                  <TextInput\n" +
          '                    label="' + fieldName + '"\n' +
          '                    type="uuid"\n' +
          '                    id="' + fieldName + '"\n' +
          '                    name="' + fieldName + '"\n' +
          "                    value={formData." + fieldName + "}\n" +
          "                    onChange={handleChange}\n" +
          "                    required\n" +
          "                  />\n" +
          "                )}\n"
        );
      }
      
      // If field has mapping but no dynamic filtering, use simple dropdown
      if (f.mapping && readmodelApiUrl) {
        return (
          "                {readmodelLoading ? (\n" +
          "                  <div className=\"text-sm text-slate-500\">Loading options...</div>\n" +
          "                ) : (\n" +
          "                  <Select\n" +
          '                    label="' + fieldName + '"\n' +
          '                    id="' + fieldName + '"\n' +
          '                    name="' + fieldName + '"\n' +
          "                    value={formData['" + fieldName + "']}\n" +
          "                    onChange={handleChange}\n" +
          "                    options={readmodelData && Array.isArray(readmodelData) && readmodelData.length > 0 && readmodelData[0]." + f.mapping + " ? readmodelData[0]." + f.mapping + ".map((item: any) => ({\n" +
          "                      value: item." + (listField?.subfields[0]?.name || 'id') + ",\n" +
          "                      label: item." + (listField?.subfields[1]?.name || 'name') + "\n" +
          "                    })) : []}\n" +
          "                    required\n" +
          "                  />\n" +
          "                )}\n"
        );
      }
      
      // Otherwise, generate regular TextInput for user-editable fields
      const fieldType =
        f.type.toLowerCase() === "string" ? "text" : f.type.toLowerCase();
      return (
        "                <TextInput\n" +
        '                    label="' +
        fieldName +
        '"\n' +
        '                    type="' +
        fieldType +
        '"\n' +
        '                    id="' +
        fieldName +
        '"\n' +
        '                    name="' +
        fieldName +
        '"\n' +
        "                    value={formData['" +
        fieldName +
        "']}\n" +
        "                    onChange={handleChange}\n" +
        "                    required\n" +
        "                />\n"
      );
    })
    .filter(field => field !== '') // Remove empty fields
    .join("\n");
}

// --- Main Generator Class ---

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.log("Eventz Generator: Constructor starting...");
    try {
      const config = require(this.env.cwd + "/config.json");
      // Handle both formats: config as object with slices, or config as slices array
      if (Array.isArray(config)) {
        this.globalConfig = { slices: config };
      } else {
        this.globalConfig = config;
      }
    } catch (e) {
      this.env.error("FATAL ERROR: config.json not found or is invalid.");
    }
  }

  async prompting() {
    this.log("Eventz Generator: Prompting phase starting...");
    this.answers = await this.prompt([
      {
        type: "input",
        name: "appName",
        message: "What is the name of your project?",
        default: "my-app",
      },
      {
        type: "checkbox",
        name: "generate",
        choices: ["skeleton", "events", "slices", "pages", "eventStore"],
      },
      {
        type: "checkbox",
        name: "slices",
        choices: this.globalConfig.slices.map((it) => it.title),
        pageSize: 20,
        loop: false,
        message: "Which Slice should be generated?",
        when: (givenAnswers) => {
          return givenAnswers.generate?.includes("slices");
        },
      },
      {
        type: "confirm",
        name: "setupSupabase",
        message: "Do you want to set up Supabase for event persistence?",
        when: (givenAnswers) => {
          return givenAnswers.generate?.includes("eventStore");
        },
        default: false,
      },
    ]);
    this.log("Eventz Generator: Prompting phase finished.");
  }

  setDefaults() {
    if (!this.answers.appName) {
      this.answers.appName = "my-app";
    }
  }

  writing() {
    this.log("Eventz Generator: Writing phase starting...");
    this.destinationRoot(this.destinationPath(this.answers.appName));
    if (this.answers.generate?.includes("skeleton")) {
      this._writeNextJsScaffolding();
    }
    if (this.answers.generate?.includes("events")) {
      this._writingEvents();
    }
    if (this.answers.generate?.includes("slices")) {
      this._writingCommands();
      this._writeRegistry();
      this._writeNextApiRoutes();
      this._writeProjections();
      this._writeReadmodelAPIs();
    }
    if (this.answers.generate?.includes("pages")) {
      this._writeUIComponents();
    }
    if (this.answers.setupSupabase) {
      this._writeSupabaseSetup();
    }
    this._cleanupOldFiles();
  }

  _cleanupOldFiles() {
    this.log(
      "---> _cleanupOldFiles: Removing old Express.js files if they exist...",
    );
    const filesToDelete = [
      "app/src/api.ts",
      "app/src/run.ts",
      "app/src/index.ts",
    ];
    filesToDelete.forEach((file) => {
      const filePath = this.destinationPath(file);
      if (this.fs.exists(filePath)) {
        this.fs.delete(filePath);
        this.log(`       - Deleted ${file}`);
      }
    });
  }

  _getHttpMethodForCommand(commandTitle) {
    const title = commandTitle.toLowerCase();
    if (title.startsWith("create")) return "POST";
    if (title.startsWith("update")) return "PUT";
    if (title.startsWith("delete")) return "DELETE";
    if (title.startsWith("get")) return "GET";
    if (title.startsWith("list")) return "GET";
    return "POST"; // Default to POST
  }

  _writeNextJsScaffolding() {
    this.log(
      "---> _writeNextJsScaffolding: Scaffolding Next.js application skeleton...",
    );
    this.fs.copyTpl(
      this.templatePath("package.json.tpl"),
      this.destinationPath("package.json"),
      { appName: this.answers.appName },
    );
    this.fs.copy(
      this.templatePath("tsconfig.json.tpl"),
      this.destinationPath("tsconfig.json"),
    );
    this.fs.copy(
      this.templatePath("next-env.d.ts.tpl"),
      this.destinationPath("next-env.d.ts"),
    );
    this.fs.copy(
      this.templatePath("index.tsx.tpl"),
      this.destinationPath("pages/index.tsx"),
    );
    this.fs.copy(
      this.templatePath("_app.tsx.tpl"),
      this.destinationPath("pages/_app.tsx"),
    );
    this.fs.copy(
      this.templatePath("globals.css.tpl"),
      this.destinationPath("styles/globals.css"),
    );
    this.fs.copy(
      this.templatePath("tailwind.config.js.tpl"),
      this.destinationPath("tailwind.config.js"),
    );
    this.fs.copy(
      this.templatePath("postcss.config.js.tpl"),
      this.destinationPath("postcss.config.js"),
    );
    this.fs.write(this.destinationPath("public/.gitkeep"), "");
    this.fs.write(this.destinationPath("pages/api/.gitkeep"), "");

    const domainDir = "app/src/common/domain";
    this.fs.copy(
      this.templatePath("Event.ts.tpl"),
      this.destinationPath(`${domainDir}/Event.ts`),
    );
    this.fs.copyTpl(
      this.templatePath("Command.ts.tpl"),
      this.destinationPath(`${domainDir}/Command.ts`),
      { scaffold: true, command: null },
    );
    this.fs.copy(
      this.templatePath("EventStore.ts.tpl"),
      this.destinationPath(`${domainDir}/EventStore.ts`),
    );
    const infraDir = "app/src/common/infrastructure";
    this.fs.copy(
      this.templatePath("RabbitMQMock.ts.tpl"),
      this.destinationPath(`${infraDir}/RabbitMQMock.ts`),
    );
    this.fs.copy(
      this.templatePath("SignalMock.ts.tpl"),
      this.destinationPath(`${infraDir}/SignalMock.ts`),
    );

    // Create components directory
    this.fs.write(this.destinationPath("app/src/components/.gitkeep"), "");
    this.fs.write(this.destinationPath("app/src/components/ui/.gitkeep"), "");

    // UI kit components
    const uiComponents = [
      "Badge",
      "Button",
      "Card",
      "CardLink",
      "NavLinkPill",
      "ReadmodelList",
      "Select",
      "TextInput",
    ];
    uiComponents.forEach((component) => {
      this.fs.copy(
        this.templatePath(`ui/${component}.tsx.tpl`),
        this.destinationPath(`app/src/components/ui/${component}.tsx`),
      );
    });

    // Generate Navigation component
    this._writeNavigationComponent();
  }

  _writeNavigationComponent() {
    this.log(
      "---> _writeNavigationComponent: Generating Navigation component...",
    );
    const slices = this.globalConfig.slices || [];
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;

    // Generate navigation links from screens only, not all slices
    const allScreens = selectedSlices.flatMap(slice => {
      const screens = slice.screens || [];
      return screens.map(screen => ({ 
        id: screen.id,
        title: screen.title, 
        slug: slugify(screen.title).toLowerCase() 
      }));
    });
    
    // Deduplicate screens by ID (same screen can appear in multiple slices)
    const uniqueScreens = Array.from(
      new Map(allScreens.map(screen => [screen.id, screen])).values()
    );
    
    const navigationLinks = uniqueScreens
      .map((screen) => {
        return `<li><NavLinkPill href="/${screen.slug}">${screen.title}</NavLinkPill></li>`;
      })
      .join("\n        ");

    this.fs.copyTpl(
      this.templatePath("Navigation.tsx.tpl"),
      this.destinationPath("app/src/components/Navigation.tsx"),
      {
        navigationLinks,
      },
    );
  }

  _writingEvents() {
    const slices = this.globalConfig.slices || [];
    if (slices.length === 0) return;
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;
    const eventsDir = "app/src/events";
    this.fs.write(this.destinationPath(`${eventsDir}/.gitkeep`), "");
    selectedSlices.forEach((slice) => {
      // Generate regular events from config
      (slice.events || [])
        .filter((ev) => ev.title && ev.context !== "EXTERNAL")
        .forEach((ev) => {
          const fileName = `${eventTitle(ev)}.ts`;
          const destinationPath = `${eventsDir}/${fileName}`;
          const fileContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { Event } from '../common/domain/Event';\n\n${renderEvent(ev)}\n`;
          this.fs.write(this.destinationPath(destinationPath), fileContent);
        });

      // Generate "Attempted" events for each command (for async architecture)
      (slice.commands || []).forEach((command) => {
        const commandType = commandTitle(command);
        const attemptedEventTitle = `${commandType}Attempted`;
        const attemptedEventName = `${attemptedEventTitle}EventName`;
        const attemptedEventType = `${attemptedEventTitle}`;

        // Use the same fields as the command for the attempted event
        const fields = command.fields || [];
        const fieldStrings = fields
          .map((f) => `    ${f.name}: ${tsType(f)}`)
          .join(";\n");
        const eventNameConst = `export const ${attemptedEventName} = '${attemptedEventTitle}';`;
        const eventType = `export type ${attemptedEventType} = Event<typeof ${attemptedEventName}, {\n${fieldStrings}\n}>;`;

        const fileName = `${attemptedEventTitle}.ts`;
        const destinationPath = `${eventsDir}/${fileName}`;
        const fileContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { Event } from '../common/domain/Event';\n\n${eventNameConst}\n\n${eventType}\n`;
        this.fs.write(this.destinationPath(destinationPath), fileContent);
      });
    });
  }

  _writingCommands() {
    const slices = this.globalConfig.slices || [];
    if (slices.length === 0) return;

    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;

    selectedSlices.forEach((slice) => {
      const sliceName = pascalCase(slice.title);
      const sliceDir = `app/src/slices/${sliceName}`;
      this.fs.write(this.destinationPath(`${sliceDir}/.gitkeep`), "");

      (slice.commands || []).forEach((command) => {
        const commandType = commandTitle(command);
        const resultingEvents = (command.dependencies || [])
          .filter(
            (dep) => dep.type === "OUTBOUND" && dep.elementType === "EVENT",
          )
          .map((dep) =>
            (this.globalConfig.slices || [])
              .flatMap((s) => s.events)
              .find((ev) => ev.id === dep.id),
          )
          .filter(Boolean);
        const eventImports = resultingEvents
          .map((event) => {
            const title = eventTitle(event);
            return `import { ${title}, ${title}EventName } from '../../events/${title}';`;
          })
          .join("\n");
        const eventUnion =
          resultingEvents.map((event) => eventTitle(event)).join(" | ") ||
          "never";
        const renderedEvents = resultingEvents
          .map((event) => renderEventAssignment(event))
          .join(",\n");

        const commandPayload = (command.fields || [])
          .map((f) => `${f.name}: command.data.${f.name}`)
          .join(",\n                ");

        const attemptedEventPayload = (command.fields || [])
          .map((f) => `    ${f.name}: ${tsType(f)};`)
          .join("\n");

        this.fs.copyTpl(
          this.templatePath("Command.ts.tpl"),
          this.destinationPath(`${sliceDir}/${commandType}Command.ts`),
          { commandType, command, tsType, scaffold: false },
        );
        this.fs.copyTpl(
          this.templatePath("decider.ts.tpl"),
          this.destinationPath(`${sliceDir}/${commandType}Decider.ts`),
          {
            commandType,
            eventImports,
            eventUnion,
            resultingEvents: renderedEvents,
          },
        );
        this.fs.copyTpl(
          this.templatePath("command-handler.ts.tpl"),
          this.destinationPath(`${sliceDir}/${commandType}CommandHandler.ts`),
          { commandType, commandPayload },
        );
        this.fs.copyTpl(
          this.templatePath("command-processor.ts.tpl"),
          this.destinationPath(`${sliceDir}/${commandType}CommandProcessor.ts`),
          { commandType },
        );
      });
    });
  }

  _writeRegistry() {
    this.log(
      "---> _writeRegistry: Generating RabbitMQ command processor registry...",
    );
    const slices = this.globalConfig.slices || [];
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;
    const commandProcessorImports = [];
    const commandProcessorInitializations = [];
    const processorImports = [];
    const processorInitializations = [];

    selectedSlices.forEach((slice) => {
      (slice.commands || []).forEach((command) => {
        const commandType = commandTitle(command);
        const sliceName = pascalCase(slice.title);
        const processorCreator = `create${commandType}CommandProcessor`;
        const processorPath = `./slices/${sliceName}/${commandType}CommandProcessor`;

        this.log(
          `[GENERATOR] Adding command processor: ${processorCreator} at ${processorPath}`,
        );
        commandProcessorImports.push(
          `import { ${processorCreator} } from '${processorPath}';`,
        );
        const initialization = `    ${processorCreator}(eventStore);`;
        commandProcessorInitializations.push(initialization);
      });

      (slice.processors || []).forEach((processor) => {
        const deps = processor.dependencies || [];
        const readmodelDeps = deps.filter(
          (dep) => dep.type === "INBOUND" && dep.elementType === "READMODEL",
        );
        readmodelDeps.forEach((dep) => {
          // Remove todoList check, always generate processor/todo
          const readmodel = this.globalConfig.slices
            .flatMap((s) => s.readmodels)
            .find((rm) => rm.id === dep.id);
          if (readmodel) {
            const readmodelName = pascalCase(readmodel.title);
            const hasTodo = readmodelName.endsWith("Todo");
            const todoReadmodelName = hasTodo
              ? readmodelName
              : `${readmodelName}Todo`;
            const sliceName = pascalCase(slice.title);
            const processorCreator = `create${todoReadmodelName}Processor`;
            const processorPath = `./slices/${sliceName}/${todoReadmodelName}Processor`;

            this.log(
              `[GENERATOR] Adding todo processor: ${processorCreator} at ${processorPath} for readmodel ${readmodel.title}`,
            );
            processorImports.push(
              `import { ${processorCreator} } from '${processorPath}';`,
            );
            const initialization = `    await ${processorCreator}().start();`;
            processorInitializations.push(initialization);
          } else {
            this.log(
              `[GENERATOR][WARN] Readmodel not found for processor dependency id=${dep.id} in slice ${slice.title}`,
            );
          }
        });
      });
    });

    this.fs.copyTpl(
      this.templatePath("registry.ts.tpl"),
      this.destinationPath("app/src/registry.ts"),
      {
        setupSupabase: this.answers.setupSupabase,
        commandHandlerImports: commandProcessorImports.join("\n"),
        commandHandlerRegistrations: commandProcessorInitializations.join("\n"),
        processorImports: processorImports.join("\n"),
        processorInitializations: processorInitializations.join("\n"),
      },
    );
  }

  _writeNextApiRoutes() {
    this.log("---> _writeNextApiRoutes: Generating Next.js API routes...");
    const slices = this.globalConfig.slices || [];
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;

    const initContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { initialize } from '../../app/src/registry';\n\nlet isInitialized = false;\n\nexport async function ensureInitialized() {\n    if (!isInitialized) {\n        await initialize();\n        isInitialized = true;\n        console.log('[API] Command bus initialized.');\n    }\n}`;
    this.fs.write(
      this.destinationPath("pages/api/initializer.ts"),
      initContent,
    );

    selectedSlices.forEach((slice) => {
      (slice.commands || []).forEach((command) => {
        const commandType = commandTitle(command);
        const commandSlug = slugify(command.title).toLowerCase();
        const sliceName = pascalCase(slice.title);
        const commandPath = `../../app/src/slices/${sliceName}/${commandType}Command`;
        const httpMethod = this._getHttpMethodForCommand(command.title);
        const requiredFields = command.fields || [];
        const attemptedEventPayload = requiredFields
          .map((f) => {
            if (f.generated && f.type.toLowerCase() === "uuid") {
              return `${f.name}: randomUUID()`;
            } else {
              return `${f.name}: req.body.${f.name}`;
            }
          })
          .join(",\n                ");
        const commandPayload = requiredFields
          .map((f) => {
            if (f.generated && f.type.toLowerCase() === "uuid") {
              return `${f.name}: randomUUID()`;
            } else {
              return `${f.name}: req.body.${f.name}`;
            }
          })
          .join(",\n                    ");

        this.fs.copyTpl(
          this.templatePath("next-api-route.ts.tpl"),
          this.destinationPath(`pages/api/${commandSlug}.ts`),
          {
            commandType,
            commandPath,
            httpMethod,
            attemptedEventPayload,
            commandPayload,
            sliceName,
          },
        );
      });
    });

    // Update index page with screen links (only screens, not all slices)
    const allScreens = selectedSlices.flatMap(slice => {
      const screens = slice.screens || [];
      return screens.map(screen => ({ 
        id: screen.id,
        title: screen.title, 
        slug: slugify(screen.title).toLowerCase() 
      }));
    });
    
    // Deduplicate screens by ID (same screen can appear in multiple slices)
    const uniqueScreens = Array.from(
      new Map(allScreens.map(screen => [screen.id, screen])).values()
    );
    
    const sliceLinks = uniqueScreens
      .map((screen) => {
        return `<li><CardLink href="/${screen.slug}">${screen.title}</CardLink></li>`;
      })
      .join("\n            ");

    this.fs.copyTpl(
      this.templatePath("index.tsx.tpl"),
      this.destinationPath("pages/index.tsx"),
      {
        sliceLinks,
      },
    );
  }

  _generateTypeDefinition(fields, typeName) {
    // Generate TypeScript interface from fields
    const fieldTypes = fields.map(field => {
      let type;
      if (field.type === 'UUID') type = 'string';
      else if (field.type === 'String') type = 'string';
      else if (field.type === 'Int' || field.type === 'Integer') type = 'number';
      else if (field.type === 'Boolean') type = 'boolean';
      else if (field.type === 'Custom' && field.subfields && field.subfields.length > 0) {
        // Generate nested type
        const subTypes = field.subfields.map(sf => {
          let stype = 'string';
          if (sf.type === 'UUID') stype = 'string';
          else if (sf.type === 'String') stype = 'string';
          else if (sf.type === 'Int' || sf.type === 'Integer') stype = 'number';
          else if (sf.type === 'Boolean') stype = 'boolean';
          return `    ${sf.name}: ${stype};`;
        }).join('\n');
        type = `{\n${subTypes}\n  }`;
        
        // Handle cardinality
        if (field.cardinality === 'List') {
          type = `Array<{\n${subTypes}\n  }>`;
        }
      } else {
        type = 'any';
      }
      
      // Handle cardinality for non-custom types
      if (field.type !== 'Custom' && field.cardinality === 'List') {
        type += '[]';
      }
      
      return `  ${field.name}: ${type};`;
    }).join('\n');
    
    return `type ${typeName} = {\n${fieldTypes}\n};`;
  }

  _generateRenderContent(fields, typeName) {
    // Check if we have a complex list field with subfields
    const listField = fields.find(f => f.type === 'Custom' && f.subfields && f.subfields.length > 0);
    
    if (!listField) {
      // Simple table for basic fields
      return this._generateSimpleTable(fields);
    }
    
    // Complex grouped table for nested data
    return this._generateGroupedTable(fields, listField);
  }

  _generateSimpleTable(fields) {
    const headers = fields
      .filter(f => !f.generated || f.type !== 'UUID') // Skip auto-generated IDs
      .map(f => `<th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">${f.name}</th>`)
      .join('\n                      ');
    
    const cells = fields
      .filter(f => !f.generated || f.type !== 'UUID')
      .map(f => `<td className="px-4 py-2 text-sm text-slate-900">{item.${f.name}}</td>`)
      .join('\n                        ');
    
    return `<Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          ${headers}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 last:border-0">
                            ${cells}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>`;
  }

  _generateGroupedTable(fields, listField) {
    // Find the connection/group ID field
    const idField = fields.find(f => f.idAttribute || f.type === 'UUID');
    
    // Generate headers for subfields
    const headers = listField.subfields
      .map(sf => {
        const label = sf.name.replace(/([A-Z])/g, ' $1').trim();
        const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
        return `<th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">${capitalized}</th>`;
      })
      .join('\n                          ');
    
    // Generate cells for subfields
    const cells = listField.subfields
      .map(sf => `<td className="px-4 py-2 text-sm text-slate-900">{item.${sf.name}}</td>`)
      .join('\n                            ');
    
    return `{/* Connection Selector */}
            {data.length > 0 && (
                <Select
                    label="Sélectionner une connexion"
                    id="connectionSelector"
                    name="connectionSelector"
                    value={selectedConnectionId}
                    onChange={(e) => setSelectedConnectionId(e.target.value)}
                    options={data.map(item => ({
                        value: item.${idField.name},
                        label: item.${idField.name}
                    }))}
                />
            )}

            {/* Data Display */}
            {data.length === 0 ? (
                <Card>
                    <p className="text-sm text-slate-600">Aucune donnée disponible pour le moment.</p>
                </Card>
            ) : !selectedConnectionId ? (
                <Card>
                    <p className="text-sm text-slate-600">Veuillez sélectionner une connexion pour voir les données.</p>
                </Card>
            ) : (() => {
                const selectedConnection = data.find(item => item.${idField.name} === selectedConnectionId);
                const itemList = selectedConnection?.${listField.name} || [];
                const listItems = Array.isArray(itemList) ? itemList : [itemList].filter(Boolean);
                
                return (
                    <Card>
                        <div className="mb-3">
                            <Badge className="mb-1">
                                {selectedConnection?.${idField.name}}
                            </Badge>
                            <p className="text-xs text-slate-500 mt-1">
                                {listItems.length} {listItems.length === 1 ? 'élément' : 'éléments'}
                            </p>
                        </div>
                        
                        {listItems.length === 0 ? (
                            <p className="text-sm text-slate-600">Aucun élément pour cette connexion.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-slate-200">
                                        <tr>
                                            ${headers}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listItems.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 last:border-0">
                                                ${cells}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                );
            })()}`;
  }

  _writeUIComponents() {
    this.log("---> _writeUIComponents: Generating UI pages from screens...");
    const slices = this.globalConfig.slices || [];
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;
    
    // Helper for default values in UI forms
    function getDefaultValue(field) {
      const type = (field.type || "").toLowerCase();
      if (type === "string" || type === "uuid") return "''";
      if (
        type === "int" ||
        type === "integer" ||
        type === "double" ||
        type === "decimal" ||
        type === "number"
      )
        return "0";
      if (type === "boolean") return "false";
      if (type === "date" || type === "datetime") return "''";
      return "null";
    }
    
    // Collect all screens from selected slices
    const allScreens = selectedSlices.flatMap(slice => {
      const screens = slice.screens || [];
      return screens.map(screen => ({ ...screen, sliceTitle: slice.title, sliceType: slice.sliceType }));
    });

    // Generate screen UI components and pages from screens (ONLY for screens that exist in config.json)
    allScreens.forEach((screen) => {
      const screenName = pascalCase(screen.title);
      const screenSlug = slugify(screen.title).toLowerCase();
      const pagePath = `pages/${screenSlug}.tsx`;
      
      // Find readmodels this screen depends on (INBOUND)
      const readmodelDeps = (screen.dependencies || []).filter(dep => 
        dep.type === 'INBOUND' && dep.elementType === 'READMODEL'
      );
      const readmodels = readmodelDeps.map(dep => {
        const rm = this.globalConfig.slices
          .flatMap(s => s.readmodels || [])
          .find(rm => rm.id === dep.id);
        if (rm) {
          const rmSlice = this.globalConfig.slices.find(s => 
            (s.readmodels || []).some(r => r.id === rm.id)
          );
          return { ...rm, sliceTitle: rmSlice?.title };
        }
        return null;
      }).filter(Boolean);

      // Find commands this screen triggers (OUTBOUND)
      const commandDeps = (screen.dependencies || []).filter(dep => 
        dep.type === 'OUTBOUND' && dep.elementType === 'COMMAND'
      );
      const commands = commandDeps.map(dep => {
        const cmd = this.globalConfig.slices
          .flatMap(s => s.commands || [])
          .find(cmd => cmd.id === dep.id);
        if (cmd) {
          const cmdSlice = this.globalConfig.slices.find(s => 
            (s.commands || []).some(c => c.id === cmd.id)
          );
          return { ...cmd, sliceTitle: cmdSlice?.title };
        }
        return null;
      }).filter(Boolean);

      // SCREEN belongs to its OUTBOUND command's slice
      // If no command, use INBOUND readmodel's slice, otherwise fallback to screen's slice property
      const owningSliceTitle = commands.length > 0 
        ? commands[0].sliceTitle 
        : (readmodels.length > 0 ? readmodels[0].sliceTitle : screen.sliceTitle);
      const sliceName = pascalCase(owningSliceTitle);
      const uiDir = `app/src/slices/${sliceName}/ui`;

      // If screen has no commands and only displays readmodel data, skip generating screen UI
      // and generate page directly with readmodel component
      if (commands.length === 0 && readmodels.length > 0) {
        const readmodelName = pascalCase(readmodels[0].title);
        const rmSliceName = pascalCase(readmodels[0].sliceTitle);
        
        // Generate page that uses the readmodel component directly
        this.fs.copyTpl(
          this.templatePath("page.tsx.tpl"),
          this.destinationPath(pagePath),
          {
            sliceName: screenName,
            sliceTitle: screen.title,
            commandUIs: `<${readmodelName} />`,
            commandImports: `import ${readmodelName} from '../app/src/slices/${rmSliceName}/ui/${readmodelName}';`,
          },
        );
        return; // Skip generating screen UI component
      }

      // Build screen UI component with screen fields
      const allFields = screen.fields || [];
      const hasMappedFields = allFields.some(f => f.mapping);
      
      // Find readmodel API URL for mapped fields
      let readmodelApiUrl = '';
      if (hasMappedFields && readmodels.length > 0) {
        readmodelApiUrl = '/api/' + slugify(readmodels[0].title).toLowerCase();
      }

      // Build TypeScript type for screen fields
      const screenPayload = allFields
        .map((f) => `${f.name}: ${tsType(f)}`)
        .join("; ");
        
      // Build default values for screen fields
      const screenPayloadDefaults =
        "{ " +
        allFields
          .map((f) => {
            // idAttribute fields (connectionId) should start empty (user selects from dropdown)
            if (f.idAttribute === true) {
              return `${f.name}: ''`;
            }
            // User-generated fields (generated=true) start empty
            if (f.generated === true) {
              return `${f.name}: ${getDefaultValue(f)}`;
            }
            // System fields (generated=false or missing) - skip complex types
            if (f.type === 'Custom') {
              return null; // Will be filtered out
            }
            return `${f.name}: ${getDefaultValue(f)}`;
          })
          .filter(v => v !== null)
          .join(", ") +
        " }";

      // Build form fields JSX for screen (generated=true is editable, idAttribute is dropdown, generated=false is read-only)
      const readmodelFields = readmodels.length > 0 ? readmodels[0].fields : [];
      const formFields = generateFormFields(allFields, readmodelApiUrl, true, readmodelFields);

      // Build readmodel component references
      const readmodelComponents = readmodels.map(rm => pascalCase(rm.title));
      const readmodelImports = readmodels.map(rm => {
        const rmName = pascalCase(rm.title);
        const rmSliceName = pascalCase(rm.sliceTitle);
        return `import ${rmName} from '../../${rmSliceName}/ui/${rmName}';`;
      });

      // Prepare command data for template
      const commandData = commands.map(cmd => ({
        name: pascalCase(cmd.title),
        title: cmd.title,
        fields: cmd.fields || [],
        apiSlug: slugify(cmd.title).toLowerCase(),
      }));

      // Generate screen UI component
      this.fs.copyTpl(
        this.templatePath("screenUI.tsx.tpl"),
        this.destinationPath(`${uiDir}/${screenName}UI.tsx`),
        {
          screenName,
          screenTitle: screen.title,
          screenPayload,
          screenPayloadDefaults,
          formFields,
          hasMappedFields,
          readmodelApiUrl,
          hasReadmodels: readmodels.length > 0,
          hasCommands: commands.length > 0,
          readmodelComponents,
          readmodelImports,
          commands: commandData,
        },
      );

      // Generate page that uses the screen UI
      this.fs.copyTpl(
        this.templatePath("page.tsx.tpl"),
        this.destinationPath(pagePath),
        {
          sliceName: screenName,
          sliceTitle: screen.title,
          commandUIs: `<${screenName}UI />`,
          commandImports: `import { ${screenName}UI } from '../app/src/slices/${sliceName}/ui/${screenName}UI';`,
        },
      );
    });

    // Generate command UI components (reusable across screens)
    selectedSlices.forEach((slice) => {
      const sliceName = pascalCase(slice.title);
      const uiDir = `app/src/slices/${sliceName}/ui`;

      // Generate UI files for commands
      (slice.commands || []).forEach((command) => {
        const commandType = commandTitle(command);
        const commandSlug = slugify(command.title).toLowerCase();
        // Include all fields (generated ones will be read-only)
        const allFields = command.fields || [];
        const nonGeneratedFields = allFields.filter((f) => !f.generated);
        
        // Detect if any fields have mapping (for dropdown selects)
        const hasMappedFields = allFields.some(f => f.mapping && !f.generated);
        
        // Find the readmodel API URL if there are mapped fields
        let readmodelApiUrl = '';
        if (hasMappedFields) {
          // Find the screen that uses this command (OUTBOUND dependency to this command)
          const screen = this.globalConfig.slices
            .flatMap(s => s.screens || [])
            .find(scr => (scr.dependencies || []).some(dep => 
              dep.type === 'OUTBOUND' && 
              dep.elementType === 'COMMAND' && 
              dep.id === command.id
            ));
          
          if (screen) {
            // Find the readmodel this screen depends on (INBOUND dependency)
            const readmodelDep = (screen.dependencies || []).find(dep => 
              dep.type === 'INBOUND' && dep.elementType === 'READMODEL'
            );
            
            if (readmodelDep) {
              const readmodel = this.globalConfig.slices
                .flatMap(s => s.readmodels || [])
                .find(rm => rm.id === readmodelDep.id);
              
              if (readmodel) {
                readmodelApiUrl = '/api/' + slugify(readmodel.title).toLowerCase();
              }
            }
          }
        }
        
        // Build TypeScript type for form fields (all fields)
        const commandPayload = allFields
          .map((f) => `${f.name}: ${tsType(f)}`)
          .join("; ");
        // Build default values for form fields (generated=true in commands means auto-generate UUID)
        const commandPayloadDefaults =
          "{ " +
          allFields
            .map((f) => {
              // Command-generated fields (generated=true) are always UUIDs
              if (f.generated === true && f.type === 'UUID') {
                return `${f.name}: crypto.randomUUID()`;
              }
              // User-provided fields start empty
              return `${f.name}: ${getDefaultValue(f)}`;
            })
            .join(", ") +
          " }";
        // Build a user-friendly command title
        const commandTitleStr = command.title || commandType;
        // Build form fields JSX - all fields editable for commands
        const formFields = generateFormFields(allFields, readmodelApiUrl, false);
        this.fs.copyTpl(
          this.templatePath("commandUI.tsx.tpl"),
          this.destinationPath(`${uiDir}/${commandType}UI.tsx`),
          {
            commandType,
            command,
            commandPayload,
            commandPayloadDefaults,
            commandSlug,
            commandTitle: commandTitleStr,
            formFields,
            hasMappedFields,
            readmodelApiUrl,
          },
        );
      });

      // Generate UI files for readmodels
      (slice.readmodels || []).forEach((readmodel) => {
        const readmodelName = pascalCase(readmodel.title);
        const apiSlug = slugify(readmodel.title).toLowerCase();
        const readmodelTitle = readmodel.title || readmodelName;

        // Generate TypeScript type definition from fields
        const typeDefinition = this._generateTypeDefinition(readmodel.fields, readmodelName + 'Data');
        
        // Generate render content based on field structure
        const renderContent = this._generateRenderContent(readmodel.fields, readmodelName + 'Data');
        
        // Get singular/plural forms for item counter
        const itemPlural = 'éléments'; // default
        const itemSingular = 'élément';

        this.fs.copyTpl(
          this.templatePath("readmodelUI.tsx.tpl"),
          this.destinationPath(`${uiDir}/${readmodelName}.tsx`),
          {
            componentName: readmodelName,
            dataType: readmodelName + 'Data',
            apiSlug,
            title: readmodelTitle,
            description: readmodel.description || 'Consultation des données',
            sectionTitle: slice.title.replace('slice: ', ''),
            typeDefinition,
            renderContent,
            itemPlural,
            itemSingular,
          },
        );
      });
      // Helper for default values in UI forms
      function getDefaultValue(field) {
        const type = (field.type || "").toLowerCase();
        if (type === "string" || type === "uuid") return "''";
        if (
          type === "int" ||
          type === "integer" ||
          type === "double" ||
          type === "decimal" ||
          type === "number"
        )
          return "0";
        if (type === "boolean") return "false";
        if (type === "date" || type === "datetime") return "''";
        return "null";
      }

      // Generate UI files for screens - DISABLED
      // Screens are redundant with readmodel lists
      // (slice.screens || []).forEach(screen => {
      //     const screenType = pascalCase(screen.title);
      //     const screenName = screenType;
      //     const screenTitle = screen.title || screenType;
      //
      //     // Find the readmodel this screen depends on (INBOUND dependency)
      //     const readmodelDep = (screen.dependencies || []).find(dep => dep.type === 'INBOUND' && dep.elementType === 'READMODEL');
      //     let apiSlug = slugify(screen.title).toLowerCase(); // default to screen's own slug
      //     if (readmodelDep) {
      //         const readmodel = this.globalConfig.slices.flatMap(s => s.readmodels).find(rm => rm.id === readmodelDep.id);
      //         if (readmodel) {
      //             apiSlug = slugify(readmodel.title).toLowerCase();
      //         }
      //     }
      //
      //     this.fs.copyTpl(
      //         this.templatePath('screen.tsx.tpl'),
      //         this.destinationPath(`${uiDir}/${screenType}.tsx`),
      //         {
      //             screenType,
      //             screenName,
      //             apiSlug,
      //             screenTitle,
      //             screen
      //         }
      //     );
      // });
    });
  }

  _writeProjections() {
    this.log(
      "---> _writeProjections: Generating projection files for readmodels...",
    );
    const log = (...args) => this.log("[GENERATOR]", ...args);
    const slices = this.globalConfig.slices || [];
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;
    selectedSlices.forEach((slice) => {
      const sliceName = pascalCase(slice.title);
      const sliceDir = `app/src/slices/${sliceName}`;
      this.fs.write(this.destinationPath(`${sliceDir}/.gitkeep`), "");

      if (slice.sliceType === "STATE_VIEW") {
        (slice.readmodels || []).forEach((readmodel) => {
          const readmodelName = pascalCase(readmodel.title);
          const projectionName = `projection${readmodelName}`;
          const fileName = `${projectionName}.ts`;
          const destinationPath = `${sliceDir}/${fileName}`;
          const fields = readmodel.fields || [];
          const fieldStrings = fields
            .map((f) => `    ${f.name}: ${tsType(f)};`)
            .join("\n");

          // Find inbound events
          const inboundEvents = (readmodel.dependencies || [])
            .filter(
              (dep) => dep.type === "INBOUND" && dep.elementType === "EVENT",
            )
            .map((dep) =>
              (this.globalConfig.slices || [])
                .flatMap((s) => s.events)
                .find((ev) => ev.id === dep.id),
            )
            .filter(Boolean);

          const eventImports = inboundEvents
            .map((event) => {
              const title = eventTitle(event);
              return `import { ${title}, ${title}EventName } from '../../events/${title}';`;
            })
            .join("\n");

          const eventsList = inboundEvents
            .map((event) => `${eventTitle(event)}EventName`)
            .join(", ");

          // For STATE_VIEW, always use regular readmodel template
          const evolveCases = inboundEvents
            .map((event) => {
              const eventType = eventTitle(event);
              const eventFields = event.fields || [];

              const assignments = eventFields
                .map(
                  (field) =>
                    `                        ${field.name}: (event.data as any).${field.name},`,
                )
                .join("\n                        ");

              return `if (event.type === ${eventType}EventName) {\n    return {\n${assignments}\n    };\n}`;
            })
            .join("\n");

          this.fs.copyTpl(
            this.templatePath("readmodel.ts.tpl"),
            this.destinationPath(destinationPath),
            {
              readmodelName,
              fieldStrings,
              eventImports,
              eventsList,
              evolveCases,
              additionalFields: "",
            },
          );
        });
      }

      // Generate todo projections for processors that depend on todoList readmodels
      (slice.processors || []).forEach((processor) => {
        const deps = processor.dependencies || [];
        const readmodelDeps = deps.filter(
          (dep) => dep.type === "INBOUND" && dep.elementType === "READMODEL",
        );
        readmodelDeps.forEach((dep) => {
          const readmodel = this.globalConfig.slices
            .flatMap((s) => s.readmodels)
            .find((rm) => rm.id === dep.id);
          if (readmodel) {
            const readmodelName = pascalCase(readmodel.title);
            const projectionName = `projection${readmodelName}Todo`;
            const fileName = `${projectionName}.ts`;
            const destinationPath = `${sliceDir}/${fileName}`;
            const fields = readmodel.fields || [];
            const fieldStrings = fields
              .map((f) => `    ${f.name}: ${tsType(f)};`)
              .join("\n");

            const inboundEvents = (readmodel.dependencies || [])
              .filter(
                (dep) => dep.type === "INBOUND" && dep.elementType === "EVENT",
              )
              .map((dep) =>
                (this.globalConfig.slices || [])
                  .flatMap((s) => s.events)
                  .find((ev) => ev.id === dep.id),
              )
              .filter(Boolean);

            // Find OUTBOUND command from the processor to get the Attempted event
            const commandDeps = processor.dependencies.filter(
              (dep) => dep.type === "OUTBOUND" && dep.elementType === "COMMAND",
            );
            let attemptedEventName = null;
            let attemptedEventImport = null;
            if (commandDeps.length > 0) {
              const command = this.globalConfig.slices
                .flatMap((s) => s.commands)
                .find((c) => c.id === commandDeps[0].id);
              if (command) {
                const cmdTitle = commandTitle(command);
                attemptedEventName = `${cmdTitle}Attempted`;
                attemptedEventImport = `import { ${attemptedEventName}, ${attemptedEventName}EventName } from '../../events/${attemptedEventName}';`;
              }
            }

            // Combine inbound events import with attempted event import
            const inboundEventImports = inboundEvents
              .map((event) => {
                const title = eventTitle(event);
                return `import { ${title}, ${title}EventName } from '../../events/${title}';`;
              })
              .join("\n");

            const eventImports = attemptedEventImport
              ? `${inboundEventImports}\n${attemptedEventImport}`
              : inboundEventImports;

            const eventsList = attemptedEventName
              ? [
                  ...inboundEvents.map(
                    (event) => `${eventTitle(event)}EventName`,
                  ),
                  `${attemptedEventName}EventName`,
                ].join(", ")
              : inboundEvents
                  .map((event) => `${eventTitle(event)}EventName`)
                  .join(", ");

            // For processors with todo, use todo template
            let evolveCases = inboundEvents
              .map((event, index) => {
                const eventType = eventTitle(event);
                const eventFields = event.fields || [];
                
                // Find the ID field (first non-generated field or idAttribute field)
                const idField = eventFields.find(f => f.idAttribute) || eventFields.find(f => !f.generated) || eventFields[0];
                const idFieldName = idField ? idField.name : 'id';

                // First event adds todo
                const isAddEvent = index === 0;

                if (isAddEvent) {
                  // First event adds todo
                  const assignments = eventFields
                    .map(
                      (field, index) =>
                        "                        " +
                        field.name +
                        ": (event.data as any)." +
                        field.name +
                        (index < eventFields.length - 1 ? "," : ""),
                    )
                    .join("\n");

                  const caseString = [
                    "            case " + eventType + "EventName: {",
                    `                const key = (event.data as any).${idFieldName}; // Use ${idFieldName} as unique key`,
                    "                if (!stateMap.has(key)) {",
                    "                    stateMap.set(key, {",
                    "                        id: key,",
                    "                        correlationId: key,",
                    "                        status: 'pending',",
                    "                        createdAt: new Date(Date.now()),",
                    "                        updatedAt: new Date(Date.now()),",
                    "                        retryCount: 0,",
                    assignments,
                    "                    });",
                    "                }",
                    "                break;",
                    "            }",
                  ].join("\n");

                  return caseString;
                } else {
                  // This shouldn't happen for inbound events
                  return "";
                }
              })
              .filter(Boolean)
              .join("\n");

            // Add case for Attempted event (marks todo as completed when command is dispatched)
            if (attemptedEventName) {
              // Get the ID field from the first inbound event
              const firstEvent = inboundEvents[0];
              const eventFields = firstEvent.fields || [];
              const idField = eventFields.find(f => f.idAttribute) || eventFields.find(f => !f.generated) || eventFields[0];
              const idFieldName = idField ? idField.name : 'id';
              
              evolveCases += `\n            case ${attemptedEventName}EventName: {
                const key = (event.data as any).${idFieldName}; // Use ${idFieldName} from event data
                if (key && stateMap.has(key)) {
                    stateMap.set(key, { ...stateMap.get(key), completed: true });
                }
                break;
            }`;
            }

            const additionalFields = fields
              .map((f) => `    ${f.name}: ${tsType(f)};`)
              .join("\n    ");

            // Generate field assignments for rebuildTodos
            const fieldAssignments = fields
              .map((f) => `                ${f.name}: state.${f.name} || ''`)
              .join(",\n");

            // Always export as get[ReadmodelName]TodoProjection for consistency
            // Only append 'Todo' if not already present
            const hasTodo = readmodelName.endsWith("Todo");
            const todoReadmodelName = hasTodo
              ? readmodelName
              : `${readmodelName}Todo`;

            this.fs.copyTpl(
              this.templatePath("todo.ts.tpl"),
              this.destinationPath(destinationPath),
              {
                readmodelName: todoReadmodelName,
                fieldStrings,
                eventImports,
                eventsList,
                evolveCases,
                additionalFields,
                fieldAssignments,
                todoProjectionExportName: `get${todoReadmodelName}Projection`,
              },
            );

            // Generate processor file using processor.ts.tpl
            const processorFileName = `${todoReadmodelName}Processor.ts`;
            const processorDestinationPath = `${sliceDir}/${processorFileName}`;

            // Use the commandDeps already found above to get command details
            let commandType = "";
            let commandPayload = "";
            if (commandDeps.length > 0) {
              const command = this.globalConfig.slices
                .flatMap((s) => s.commands)
                .find((c) => c.id === commandDeps[0].id);
              if (command) {
                commandType = commandTitle(command);
                commandPayload = (command.fields || [])
                  .map((f) => {
                    if (f.generated && f.type.toLowerCase() === "uuid") {
                      return `${f.name}: randomUUID()`;
                    } else {
                      return `${f.name}: todo.${f.name}`;
                    }
                  })
                  .join(",\n                ");
              }
            }

            // Get the first inbound event name for the processor to subscribe to
            const inboundEventName =
              inboundEvents.length > 0 ? eventTitle(inboundEvents[0]) : "";

            // Get the outbound command's "Attempted" event name
            const outboundAttemptedEventName = commandType ? `${commandType}Attempted` : "";

            this.fs.copyTpl(
              this.templatePath("processor.ts.tpl"),
              this.destinationPath(processorDestinationPath),
              {
                readmodelName: todoReadmodelName,
                commandType,
                commandPayload,
                inboundEventName,
                outboundAttemptedEventName,
                todoProjectionExportName: `get${todoReadmodelName}Projection`,
              },
            );
          }
        });
      });
    });
  }

  _writeReadmodelAPIs() {
    this.log(
      "---> _writeReadmodelAPIs: Generating Next.js API routes for readmodels...",
    );
    const slices = this.globalConfig.slices || [];
    const selectedSlices = this.answers.slices
      ? slices.filter((slice) => this.answers.slices.includes(slice.title))
      : slices;
    selectedSlices
      .filter((slice) => slice.sliceType === "STATE_VIEW")
      .forEach((slice) => {
        const sliceName = pascalCase(slice.title);
        (slice.readmodels || []).forEach((readmodel) => {
          const readmodelName = pascalCase(readmodel.title);
          const projectionName = `projection${readmodelName}`;
          const apiSlug = slugify(readmodel.title).toLowerCase();
          const apiContent = `/*\n * Copyright (c) 2025 Nebulit GmbH\n * Licensed under the MIT License.\n */\n\nimport { NextApiRequest, NextApiResponse } from 'next';\nimport { ensureInitialized } from './initializer';\nimport { get${readmodelName}Projection } from '../../app/src/slices/${sliceName}/${projectionName}';\n\nensureInitialized();\n\nexport default async function handler(req: NextApiRequest, res: NextApiResponse) {\n    if (req.method !== 'GET' && req.method !== 'POST') {\n        return res.status(405).json({ message: 'Method not allowed' });\n    }\n    try {\n        const data = await get${readmodelName}Projection();\n        return res.status(200).json(data);\n    } catch (error) {\n        console.error(error);\n        return res.status(500).json({ message: 'Internal server error' });\n    }\n}`;

          this.fs.write(
            this.destinationPath(`pages/api/${apiSlug}.ts`),
            apiContent,
          );
        });
      });
  }

  _writeScreenPages() {
    // DISABLED: Screen pages are redundant with readmodel lists
    // this.log('---> _writeScreenPages: Generating pages for screens...');
    // const slices = this.globalConfig.slices || [];
    // slices.filter(slice => slice.sliceType === 'STATE_VIEW').forEach(slice => {
    //     (slice.screens || []).forEach(screen => {
    //         const screenSlug = slugify(screen.title).toLowerCase();
    //         const readmodelDeps = (screen.dependencies || [])
    //             .filter(dep => dep.type === 'INBOUND' && dep.elementType === 'READMODEL')
    //             .map(dep => (this.globalConfig.slices || []).flatMap(s => s.readmodels).find(rm => rm.id === dep.id))
    //             .filter(Boolean);
    //         if (readmodelDeps.length > 0) {
    //             const readmodel = readmodelDeps[0]; // Assume one readmodel per screen
    //             const apiSlug = slugify(readmodel.title).toLowerCase();
    //             const screenName = pascalCase(screen.title);
    //             this.fs.copyTpl(this.templatePath('screen.tsx.tpl'), this.destinationPath(`pages/${screenSlug}.tsx`), {
    //                 screenName,
    //                 screenTitle: screen.title,
    //                 apiSlug
    //             });
    //         }
    //     });
    // });
    // // Update index page with screen links
    // const screenLinks = slices.filter(slice => slice.sliceType === 'STATE_VIEW').flatMap(slice =>
    //     (slice.screens || []).map(screen => {
    //         const screenSlug = slugify(screen.title).toLowerCase();
    //         return `<Link href="/${screenSlug}"><a>${screen.title}</a></Link>`;
    //     })
    // ).join('\n                    ');
    // const currentIndexContent = this.fs.read(this.destinationPath('pages/index.tsx'));
    // const updatedIndexContent = currentIndexContent.replace(
    //     /(<Link href="\/[^"]+"><a>[^<]+<\/a><\/Link>\n                    )+/g,
    //     `$&${screenLinks}\n                    `
    // );
    // this.fs.write(this.destinationPath('pages/index.tsx'), updatedIndexContent);
  }

  _writeSupabaseSetup() {
    this.log("---> _writeSupabaseSetup: Creating Supabase files...");
    const envPath = this.destinationPath(".env.local");
    if (this.fs.exists(envPath)) {
      this.log(
        "WARNING: .env.local already exists. Please ensure it contains the required Supabase variables.",
      );
    } else {
      this.fs.copy(this.templatePath(".env.example.tpl"), envPath);
    }
    this.fs.copy(
      this.templatePath("SupabaseEventStore.ts.tpl"),
      this.destinationPath(
        "app/src/infrastructure/persistence/SupabaseEventStore.ts",
      ),
    );
    this.fs.copy(
      this.templatePath("create_events_table.sql.tpl"),
      this.destinationPath("migrations/create_events_table.sql"),
    );
  }

  end() {
    this.log("=======================================================");
    this.log("Eventz Generator: All tasks finished. Job is Done!");
    this.log("=======================================================");
  }
};
