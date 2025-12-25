/*
 * Copyright (c) 2025 Nebulit GmbH
 * Licensed under the MIT License.
 */

var Generator = require('yeoman-generator');
const {_screenTitle, _sliceTitle, _processorTitle} = require("../../common/util/naming");

let config = {}

module.exports = class extends Generator {

    constructor(args, opts) {
        super(args, opts);
        this.log("Initializing the nextjs-prototype generator...");
        this.argument('appname', {type: String, required: false});
        this.log(`Loading configuration from: ${this.env.cwd}/config.json`);
        config = require(this.env.cwd + "/config.json");
    }

    // Async Await
    async prompting() {
        this.log("Starting prompting phase...");
        this.answers = await this.prompt([{
            type: 'input',
            name: 'appName',
            message: 'Projectname?',
            when: () => !config?.codeGen?.application,
        },
            {
                type: 'checkbox',
                name: 'slices',
                choices: config.slices.map(it => it.title),
                loop: false,
                message: 'Which Slice should be generated?'
            }]);
        this.log("Prompting finished. User answers:");
        this.log(this.answers);
    }

    setDefaults() {
        if (!this.answers.appName) {
            this.answers.appName = config?.codeGen?.application
        }
    }

    writing() {
        this.log(`Starting to write files for project: ${this.answers.appName}`);
        this._writeReactSkeleton();
        this.composeWith(require.resolve('../slices'), {
            answers: this.answers,
            appName: this.answers.appName ?? this.appName,
            config: config
        });
    }

    _writeReactSkeleton() {

        var sliceViews = this.answers.slices.flatMap((sliceName) => {
            var slice = config.slices.find(it => it.title === sliceName)
            var screens = this._findScreensForSlice(slice)

            return screens?.map((screen) => {
                return `
                        {
                            "slice":"${_sliceTitle(slice.title)}",
                            "viewType":"${screen}",
                            "viewName" : "${_sliceTitle(slice.title)}/${screen}",
                            "commandView" : ${_sliceTitle(slice.title)}${screen}
                        }`
            })

        }).join(",")
        
        this.log("Generated slice views configuration:");
        this.log(sliceViews);

        var componentImports = this.answers.slices.flatMap((sliceName) => {
            var slice = config.slices.find(it => it.title === sliceName)
            var screens = this._findScreensForSlice(slice)
            return screens?.map((screen) => {
                var sliceName = _sliceTitle(slice.title)
                return `import ${sliceName}${screen} from '@/app/components/slices/${sliceName}/${screen}';\n`
            })

        }).join("\n")
        
        this.log("Generated component imports:");
        this.log(componentImports);

        this.log("Copying root template files (statically)...");
        this.fs.copy(
            this.templatePath('root'),
            this.destinationPath(this.answers.appName)
        );

        this.log("Templating pages/index.tsx...");
        this.fs.copyTpl(
            this.templatePath('root/pages/index.tsx'),
            this.destinationPath(`${this.answers.appName}/pages/index.tsx`),
            {
                appName: this.answers.appName,
                _views: sliceViews,
                _imports: componentImports,
            }
        );

        this.log("Copying .cursor file...");
        this.fs.copy(
            this.templatePath('root/.cursor'),
            this.destinationPath(`${this.answers.appName}/.cursor`)
        )

        this.log("Templating .gitignore file...");
        this.fs.copyTpl(
            this.templatePath('git/gitignore'),
            this.destinationPath(`${this.answers.appName}/.gitignore`),
            {
                rootPackageName: this.answers.rootPackageName
            }
        )
    }

    end() {
        this.log("Generator finished successfully!");
        this.log(`Project '${this.answers.appName}' created in ./${this.answers.appName}`);
    }

    _findScreensForSlice(slice) {
        var screenNames = slice.screens.map(it => _screenTitle(it.title))

        return screenNames
    }
};
