require( "../setup" );
var os = require( "os" );
var controlFn = require( "../../src/control" );

var fsm = {
	reset: _.noop,
	start: _.noop,
	stop: _.noop
};

function getConfig() {
	return require( "../../src/config.js" )( {
		index: {
			frequency: 100
		},
		package: { // jshint ignore : line
			branch: "master",
			owner: "me",
			project: "test",
			build: 1
		}
	} );
}

describe( "Control", function() {
	var control;
	describe( "when changing service configuration", function() {
		describe( "and setting branch and version", function() {
			var fsmMock, config;
			before( function() {
				config = getConfig();
				fsmMock = sinon.mock( fsm );
				fsmMock.expects( "reset" )
					.withArgs( config )
					.once();
				control = controlFn( config, fsm );
				control.configure( [
					{ op: "change", field: "branch", value: "develop" },
					{ op: "change", field: "version", value: "0.1.1" },
					{ op: "change", field: "owner", value: "person" },
					{ op: "change", field: "releaseOnly", value: true }
				] );
			} );

			it( "should change configuration", function() {
				config.package.should.eql( {
					architecture: "x64",
					branch: "develop",
					files: path.resolve( "./downloads" ),
					os: {},
					osName: "any",
					osVersion: "any",
					owner: "person",
					platform: os.platform(),
					project: "test",
					releaseOnly: true,
					version: "0.1.1"
				} );
			} );

			it( "should change filter", function() {
				config.filter.toHash().should.eql( {
					architecture: "x64",
					branch: "develop",
					osName: "any",
					osVersion: "any",
					owner: "person",
					platform: os.platform(),
					project: "test",
					releaseOnly: true,
					version: "0.1.1"
				} );
			} );

			it( "should call fsm reset with config", function() {
				fsmMock.verify();
			} );

			describe( "then removing version", function() {
				var fsmMock;
				before( function() {
					fsmMock = sinon.mock( fsm );
					fsmMock.expects( "reset" )
						.withArgs( config )
						.once();
					control = controlFn( config, fsm );
					control.configure( [
						{ op: "remove", field: "version" },
						{ op: "change", field: "releaseOnly", value: false }
					] );
				} );

				it( "should remove version from config.package", function() {
					config.package.should.eql( {
						architecture: "x64",
						branch: "develop",
						files: path.resolve( "./downloads" ),
						os: {},
						osName: "any",
						osVersion: "any",
						owner: "person",
						platform: os.platform(),
						project: "test",
						releaseOnly: false,
						version: undefined
					} );
				} );

				it( "should remove version filter", function() {
					config.filter.toHash().should.eql( {
						architecture: "x64",
						branch: "develop",
						osName: "any",
						osVersion: "any",
						owner: "person",
						platform: os.platform(),
						project: "test",
						releaseOnly: false
					} );
				} );

				it( "should call fsm reset with config", function() {
					fsmMock.verify();
				} );
			} );

			describe( "then chaning owner and version with build included", function() {
				var fsmMock;
				before( function() {
					fsmMock = sinon.mock( fsm );
					fsmMock.expects( "reset" )
						.withArgs( config )
						.once();
					control = controlFn( config, fsm );
					control.configure( [
						{ op: "change", field: "version", value: "0.1.1-10" },
						{ op: "change", field: "owner", value: "you" }
					] );
				} );

				it( "should remove version from config.package", function() {
					config.package.should.eql( {
						architecture: "x64",
						branch: "develop",
						build: "10",
						files: path.resolve( "./downloads" ),
						os: {},
						osName: "any",
						osVersion: "any",
						owner: "you",
						platform: os.platform(),
						project: "test",
						releaseOnly: false,
						version: "0.1.1"
					} );
				} );

				it( "should remove version filter", function() {
					config.filter.toHash().should.eql( {
						architecture: "x64",
						branch: "develop",
						build: "10",
						osName: "any",
						osVersion: "any",
						owner: "you",
						platform: os.platform(),
						project: "test",
						version: "0.1.1",
						releaseOnly: false
					} );
				} );

				it( "should call fsm reset with config", function() {
					fsmMock.verify();
				} );
			} );
		} );
	} );

	describe( "when changing environment", function() {
		var config, fsmMock, fsm, result;
		before( function() {
			process.env.TO_REMOVE = "remove this";
			process.env.TO_CHANGE = "change this";
			config = getConfig();
			fsmMock = sinon.mock( fsm );
			control = controlFn( config, fsm );
			result = control.setEnvironment( [
				{ op: "change", variable: "TO_CHANGE", value: "new value" },
				{ op: "remove", variable: "TO_REMOVE" }
			] );
		} );

		it( "should have changed a variable and removed another", function() {
			result.should.eql( {
				TO_CHANGE: "new value",
				removed: [ "TO_REMOVE" ]
			} );
		} );
	} );
} );
