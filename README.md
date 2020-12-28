# Dreamt

Client side engine for immersive, networked, expressive creations.

[![Package Version][package-image]][package-url]
[![Open Issues][issues-image]][issues-url]
[![Build Status][build-image]][build-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Dependencies Status][dependencies-image]][dependencies-url]
[![Dev Dependencies Status][dev-dependencies-image]][dev-dependencies-url]
[![Commitizen Friendly][commitizen-image]][commitizen-url]

## Contents

- [Suggested Development Workflow](#development-workflow)
- [Releasing New Code](#releasing)
- [Contributing](#contributing)
- [Credits](#credits)

### Development Workflow

These steps need to be performed whenever you make changes:

0. Write awesome code in the `src` directory.
1. Build (clean, lint, and transpile): `npm run build`
2. Create unit tests in the `test` directory.
3. Verify code coverage: `npm run cover:check`
4. Commit your changes using `git add` and `git cz`
5. Push to GitHub using `git push` and wait for the CI builds to complete.

Note: This project uses automated changelog generation as long as you follow [Conventional Commits](https://conventionalcommits.org), which is made simple through the included [Commitizen CLI](http://commitizen.github.io/cz-cli/).

### Releasing

Follow these steps to update the NPM package:

0. Perform all development workflow steps including pushing to GitHub in order to verify the CI builds. You don't want to publish a broken package!
1. Check to see if this qualifies as a major, minor, or patch release: `npm run changelog:unreleased`
2. Bump the NPM version following [Semantic Versioning](https://semver.org) by using **one** of these approaches:
   - Specify major, minor, or patch and let NPM bump it: `npm version [major | minor | patch] -m "chore(release): Bump version to %s."`
   - Explicitly provide the version number such as 1.0.0: `npm version 1.0.0 -m "chore(release): Bump version to %s."`
3. The push to GitHub is automated, so wait for the CI builds to finish.
4. Publish the new version to NPMJS: `npm publish`

### Contributing

0. Create a fork on GitHub
1. Use the [Suggested Development Workflow](#development-workflow)
2. Create a GitHub pull request from your fork

Alternatively, (though less awesomely):

0. Create an issue on GitHub
1. Describe the issue in as much detail as possible. This makes up for not going the pull request route.
   - What happened
   - What did you expect
   - What browser/OS versions were you using
   - What have you tried to fix

### Credits

- @chriswells0
  - the fantastic [Typescript node package](https://github.com/chriswells0/node-typescript-template) template used as a starting point

[project-url]: https://github.com/patreeceeo/dreamt.js
[package-image]: https://badge.fury.io/js/typescript-template.svg
[package-url]: https://badge.fury.io/js/typescript-template
[issues-image]: https://img.shields.io/github/issues/patreeceeo/dreamt.js.svg?style=popout
[issues-url]: https://github.com/patreeceeo/dreamt.js/issues
[build-image]: https://travis-ci.org/patreeceeo/dreamt.js.svg?branch=main
[build-url]: https://travis-ci.org/patreeceeo/dreamt.js
[coverage-image]: https://coveralls.io/repos/github/patreeceeo/dreamt.js/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/patreeceeo/dreamt.js?branch=main
[dependencies-image]: https://david-dm.org/patreeceeo/dreamt.js/status.svg
[dependencies-url]: https://david-dm.org/patreeceeo/dreamt.js
[dev-dependencies-image]: https://david-dm.org/patreeceeo/dreamt.js/dev-status.svg
[dev-dependencies-url]: https://david-dm.org/patreeceeo/dreamt.js?type=dev
[commitizen-image]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli
