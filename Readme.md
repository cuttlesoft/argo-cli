# Argo CLI

## About

Argo CLI is a command line tool for project management.

## Installation

Change into the argo.cli directory and run

    npm install && npm link

## Usage

To run argo, the team name for Bitbucket must be configured as an environment variable:

    $ export BITBUCKET_TEAM_NAME=<your-bitbucket-team-name>

### Initialize Project

Initialize a new Argo project, either from scratch or within an existing project/repository.

    argo init

When initializing a new project from scratch, the Argo project and associated repository will be created in a new directory, relative to the current directory, based on the user's selections in the CLI prompt.

When initializing a new project from an existing project/repository, the Argo project will be created within the existing project folder.

### Update Project

COMING SOON

    argo update

### Rule Management

Rules are composed of three parts.

1. The trigger

2. The condition(s)

3. The action(s)

The **trigger** dictates when to check the rule.

The **condition(s)** are what determines whether a given rule should be invoked when it is triggered. A condition consists of a condition type and a condition value.

The **action(s)** are essentially what a matched rule will be called upon to do. An action consists of an action type and an action value.

Example:
> A rule consisting of

> - Trigger: **push**

> - Condition: **branch** type, **vanguard** value

> - Action: **http** type, **http://api.example.com/do_something** value

> would, when the project was pushed with changes to the "vanguard" branch, send an HTTP request to http://api.example.com/do_something.

#### Add

Add a new rule to an existing Argo project, following prompts from the CLI.

    argo rule add

## Testing

IN PROGRESS

    npm test

## Troubleshooting

If `./bin/argo` works but `argo` does not, run `npm link` from the project root.

## License

Copyright (c) 2016 Cuttlesoft

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

## Acknowledgments
