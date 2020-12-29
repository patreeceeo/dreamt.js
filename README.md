# Dreamt

Just a thing I dreamt up to help me keep pace with my imagination.

Dreamt is a nascent game engine for the Web. Ideal for multiplayer games with high vividness and process intensity. This package constitutes the client-side half of the complete engine, though it can be used alone for single player or local multiplayer games. Taking a cue from React, its API aims to be declarative wherever possible.

Its current design couples tighly with React because it suits me this way. It could made be more platform-agnostic, through a plugin system for example, if there's enough interest.

[![Package Version][package-image]][package-url]
[![Open Issues][issues-image]][issues-url]
[![Build Status][build-image]][build-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Dependencies Status][dependencies-image]][dependencies-url]
[![Dev Dependencies Status][dev-dependencies-image]][dev-dependencies-url]
[![Commitizen Friendly][commitizen-image]][commitizen-url]

## Contents

- [An example usage](#example)
- [Suggested Development Workflow](#developing)
- [Releasing New Code](#releasing)
- [Contributing](#contributing)
- [Credits](#credits)

### Example

The code below is just meant to be illustrative, it is not _necessarily_ a functioning program.

```javascript.jsx
/* GolfBall.jsx */
import * as React from 'react';
import {useSphere} from '@react-three/cannon';
import {Position3D, Rotation3D} from 'dreamt/components';
import {useComponent} from 'dreamt/hooks/react';

export const GolfBall = ({scripts}) => {
  const position = useComponent(Position3D);
  const rotation = useComponent(Rotation3D);

  const [cannon, cannonApi] = useSphere(() => ({
    args: 1
    position,
    rotation,
    mass: 4
  }),
    null,
    [position, rotation]
  );

  React.useEffect(() => {
    scripts.provide({cannonApi});
  }, [cannonApi]);

  // Using primatives from react-three-fiber
  return (
    <mesh ref={cannon}>
      <sphereBufferGeometry args={1}/>
      <meshBasicMaterial color="blue"/>
    </mesh>
  )
}

/* main.js */
import * as Dreamt from 'dreamt';
import {withPosition3d, withRotation3d, withScript, withReactThree} from 'dreamt/components';
import {GolfBallScript, BilliardBallScript} from './scripts';
import {selectCurrentWorld, selectYourTurn, selectError} from './globalState';

Dreamt.defWorld("minigolf", ({yourTurn}) => {
  const entities = [
    Dreamt.defEntity(
      // Shorthand for withComponent(Position3d).
      // These components allow scripts to access the corresponding
      // properties of the entity, without them, @react-three/cannon can still
      // update them directly on the Object3D instances.
      withPosition3d(),
      withRotation3d(),
      withScript(GolfBallScript, {yourTurn}),
      withReactThree(GolfBall)
    ),
  ];

  return {entities};
}, {
  "data.selectors": {
    yourTurn: selectYourTurn,
  }
})

Dreamt.defWorld("billiards", ({yourTurn}) => {
  const entities = [
    Dreamt.defEntity(
      withPosition3d(),
      withRotation3d(),
      withScript(BilliardBallScript, {yourTurn}),
      withReactThree(BilliardBallMesh)
    ),
  ];

  return {entities};
}, {
  "data.selectors": {
    yourTurn: selectYourTurn,
  }
});

const engine = new Dreamt.Engine(
  ({currentWorld, error}) => {
    if(!error) {
      Dreamt.visitWorld(currentWorld);
    } else {
      displayErrorScreen(error);
    }
  },
  {
    "network.socket": {
      path: "/socket",
      params: {
        playerId: () => localStorage.getItem("playerId")
      },
      topic: "sportballs"
    },
    "data.selectors": {
      currentWorld: selectCurrentWorld,
      error: selectError
    }
  }
)

// Start this whole shebang!
engine.loopForever();
```

Note: Physics, if desired, can be wired up using [`@react-three/cannon`](https://github.com/pmndrs/use-cannon) within `react-three-fiber` components.

PS: Until [#124](https://github.com/pmndrs/use-cannon/pull/124) is merged I recommend using [my fork of @react-three/cannon](https://github.com/patreeceeo/use-cannon).

### Developing

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
