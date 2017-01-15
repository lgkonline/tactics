function hasClass(el, className) {
	if (el.classList)
		return el.classList.contains(className)
	else
		return !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
}

function addClass(el, className) {
	if (el.classList)
		el.classList.add(className)
	else if (!hasClass(el, className)) 
		el.className += " " + className
}

function removeClass(el, className) {
	if (el.classList)
		el.classList.remove(className)
	else if (hasClass(el, className)) {
		el.className=el.className.replace(new RegExp('(\\s|^)' + className + '(\\s|$)'), ' ')
	}
}

var data = {
	selectedCols: []
};

var events = {
	selectedCol: new Event("selectedCol"),
	selectedAction: new Event("selectedAction"),
	selectedOrientation: new Event("selectedOrientation")
};

var bot = {
	doTurn: function() {
		var doAttack = function(action) {
			app.doAction(action);

			setTimeout(function() {
				var target = {
					figure: null,
					coordination: null	
				};

				for (var i = 0; i < app.figures.length; i++) {
					for (var j = 0; j < data.selectedCols.length; j++) {
						var isAttackable = (action.id != "move" && 
							app.figures[i].coordination.r == data.selectedCols[j].r && 
							app.figures[i].coordination.c == data.selectedCols[j].c);

						if (isAttackable) {
							if (app.figures[i].team != app.currentFigure.team) {
								selectableFigures.push(app.figures[i]);

								if (target.figure == null || app.figures[i].tp < target.figure.tp) {
									target.figure = app.figures[i];
									target.coordination = app.figures[i].coordination;
								}
							}
						}
						else if (!isAttackable) {
							// move
							if (target.coordination == null || 
									(target.coordination.r > data.selectedCols[j].r && target.coordination.c > data.selectedCols[j].c)
								) {
									target.coordination = data.selectedCols[j];
							}
						}
					}
				}

				if (action.id != "move" && target.figure == null) {
					console.log("wait");
					app.doAction(app.getAction(app.currentFigure, "wait"));
				}
				else {
					app.selectCol(target.coordination.r, target.coordination.c);
				}
			}, 500);
		};

		var selectableFigures = [];
		var action;
		var accessible = false;

		if (app.isSubTurn) {
			action = app.getAction(app.currentFigure, "thunder");
			if (action == null || app.currentFigure.mp < action.mpCost) {
				action = app.getAction(app.currentFigure, "fight");
			}
			doAttack(action);
		}
		else {
			action = app.getAction(app.currentFigure, "move");
			// app.doAction(action);
			doAttack(action);

		}

		setTimeout(function() {
			app.chooseOrientation("top");
		}, 1000);
	}
};

var app = new Vue({
	el: "#app",
	data: {
		gameStarted: false,
		alertMessage: null,
		isMoving: false,
		isSubTurn: false,
		showOrientationControls: false,
		turnNumber: 0,
		rows: 6,
		cols: 8,
		currentFigure: null,
		selectedFigure: null,
		focusedFigure: null,
		selectedAction: null,
		selectedCols: [],
		teams: teams.teams,
		figures: teams.figures
	},
	methods: {
		initFigures: function() {
			for (var i = 0; i < app.figures.length; i++) {
				app.figures[i].maxTp = app.figures[i].tp;
				app.figures[i].maxMp = app.figures[i].mp;
				app.figures[i].action.push({
					id: "wait"
				});
				app.figures[i].teamObj = app.teams[app.figures[i].team];
				app.figures[i].moveDirection = false;
			}
		},
		figureInfoIn: function() {
			var el = document.querySelector("#figure-info");
			el.style.backgroundColor = app.currentFigure.teamObj.color;
			addClass(el, "in");
			setTimeout(function() {
				removeClass(el, "in");
			}, 500);
		},
		focusFigure: function(figure) {
			if (app.focusedFigure != figure) {
				app.focusedFigure = figure;
				var el = document.querySelector("#focused-figure-info");
				el.style.backgroundColor = app.focusedFigure.teamObj.color;
				addClass(el, "in");
				setTimeout(function() {
					removeClass(el, "in");
				}, 500);
			}
			else {
				app.focusedFigure = null;
			}
		},
		alert: function(message) {
			app.alertMessage = message;
			setTimeout(function() {
				app.alertMessage = null;
			}, 3000);
		},
		getAction: function(figure, actionId) {
			for (var j = 0; j < figure.action.length; j++) {
				if (figure.action[j].id == actionId) 
					return figure.action[j];
			}
			return null;
		},
		isColSelectable: function(rIndex, cIndex) {
			var sR = app.selectedFigure.coordination.r;
			var sC = app.selectedFigure.coordination.c;
			var diffR = Math.abs(sR - rIndex);
			var diffC = Math.abs(sC - cIndex);

			var retVal = (diffR + diffC) <= app.selectedAction.range;
			if (retVal) {
				data.selectedCols.push({r: rIndex, c: cIndex});
			}
			return retVal;
		},
		selectCol: function(rIndex, cIndex) {
			var attack = function() {
					if (Math.random() > app.selectedAction.missRange) {
						app.figures[i].tp += app.selectedAction.tp;

						if (app.figures[i].tp > app.figures[i].maxTp) {
							app.figures[i].tp = app.figures[i].maxTp;
						}

						if (app.figures[i].tp <= 0) {
							var team = app.figures[i].team;
							app.alert(app.figures[i].id + " is KO!");
							app.figures.splice(i, 1);

							var teamDead = true;
							var teams = [];
							for (var j = 0; j < app.figures.length; j++) {
								if (app.figures[j].team == team) {
									teamDead = false;
								}
								if (!(teams.indexOf(app.figures[j].team) > -1)) {
									teams.push(app.figures[j].team);
								}
							}
							if (teams.length <= 1) {
								// app.alert("Team '" + teams[0] + "' wins!");
								alert("Team '" + teams[0] + "' wins!\nPlay again?");
								location.reload();
							}
							else if (teamDead) {
								app.alert("Team '" + team + "' is KO!");
							}
						}	
					}
					else {
						app.alert("Missed!");
					}
			};

			var timer;
			var figureMoveDirection;
			var figureAfterMove = null;
			var figureMoveChecker = function() {
				var prop, value;
				if (figureMoveDirection == "top" || figureMoveDirection == "bottom") {
					prop = "r";
					value = rIndex;
				}
				else {
					prop = "c";
					value = cIndex;
				}

				if (app.currentFigure.coordination[prop] != value) {
					app.isMoving = true;
					app.currentFigure.moveDirection = figureMoveDirection;
					if (figureMoveDirection == "top" || figureMoveDirection == "left") {
						app.currentFigure.coordination[prop]--;
					}
					else {
						app.currentFigure.coordination[prop]++;
					}
				}
				else {
					if (!figureAfterMove) {
						finish();
					}
					else {
						figureAfterMove();
						figureAfterMove = null;
					}
				}
			};

			var finish = function() {
				app.isMoving = false;
				clearInterval(timer);
				app.currentFigure.moveDirection = null;
				app.selectedFigure = null;
				document.dispatchEvent(events.selectedCol);
			}

			if (app.isColSelectable(rIndex, cIndex)) {
				if (app.selectedAction.id == "move") {
					for (var fi = 0; fi < app.figures.length; fi++) {
						if (app.figures[fi].coordination.r == rIndex && app.figures[fi].coordination.c == cIndex) {
							return;
						}
					}

					if (rIndex < app.currentFigure.coordination.r && cIndex < app.currentFigure.coordination.c) {
						// top left
						figureMoveDirection = "top";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "left";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}
					else if (rIndex < app.currentFigure.coordination.r && cIndex > app.currentFigure.coordination.c) {
						// top right
						figureMoveDirection = "top";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "right";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}
					else if (rIndex > app.currentFigure.coordination.r && cIndex < app.currentFigure.coordination.c) {
						// bottom left
						figureMoveDirection = "bottom";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "left";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}
					else if (rIndex > app.currentFigure.coordination.r && cIndex > app.currentFigure.coordination.c) {
						// bottom right
						figureMoveDirection = "bottom";
						figureAfterMove = function() {
							figureMoveDoFinish = true;
							figureMoveDirection = "right";
							app.currentFigure.orientation = figureMoveDirection;
						};
					}					
					if (rIndex < app.currentFigure.coordination.r) {
						figureMoveDirection = "top";
					}
					else if (rIndex > app.currentFigure.coordination.r) {
						figureMoveDirection = "bottom";
					}
					else if (cIndex < app.currentFigure.coordination.c) {
						figureMoveDirection = "left";
					}
					else if (cIndex > app.currentFigure.coordination.c) {
						figureMoveDirection = "right";
					}
					else {
						app.currentFigure.coordination.r = rIndex;
						app.currentFigure.coordination.c = cIndex;
						finish();
					}

					app.currentFigure.orientation = figureMoveDirection;

					figureMoveChecker();
					timer = setInterval(figureMoveChecker, 500);
				}
				else {
					for (var i = 0; i < app.figures.length; i++) {
						if (app.figures[i].coordination.r == rIndex && app.figures[i].coordination.c == cIndex) {
							if (app.selectedAction.mpCost) {
								if (app.currentFigure.mp >= app.selectedAction.mpCost) {
									app.currentFigure.mp -= app.selectedAction.mpCost;
									attack();
								}
								else {
									app.alert("You don't have enough MP!");
								}
							}
							else {
								attack();
							}
						}
					}
					finish();
				}
			}
		},
		doAction: function(action) {
			data.selectedCols = [];
			app.selectedAction = action;
			app.selectedFigure = app.currentFigure;

			document.dispatchEvent(events.selectedAction);
		},
		chooseOrientation: function(orientation) {
			app.currentFigure.orientation = orientation;
			document.dispatchEvent(events.selectedOrientation);
		},
		turn: function(figureIndex, isSubTurn) {
			app.showOrientationControls = false;
			app.selectedAction = null;
			app.selectedFigure = null;

			figureIndex = figureIndex || 0;
			isSubTurn = isSubTurn || false;
			app.isSubTurn = isSubTurn;

			var figure = app.figures[figureIndex];
			if (typeof(figure) == "undefined" || figure == null) {
				figureIndex = 0;
				figure = app.figures[figureIndex];
			}

			app.currentFigure = figure;

			if (!isSubTurn) {
				app.figureInfoIn();
			}

			var orientationChange = function() {
				document.removeEventListener("selectedOrientation", orientationChange, false);
				if (isSubTurn || app.selectedAction.id == "wait") {
					app.turn(figureIndex+1);
				}
				else {
					app.turn(figureIndex, true);
				}
			};

			var actionChange = function() {
				if (app.selectedAction.id == "wait") {
					afterActionChange();
				}
				else {
					document.addEventListener("selectedCol", afterActionChange, false);
				}
			};
			var afterActionChange = function() {
				document.removeEventListener("selectedAction", actionChange , false);
				document.removeEventListener("selectedCol", afterActionChange, false);
				if (isSubTurn) {
					app.showOrientationControls = true;
					document.addEventListener("selectedOrientation", orientationChange, false);
				}
				else {
					orientationChange();
				}
			};

			document.addEventListener("selectedAction", actionChange, false);

			if (figure.teamObj.id == "Bot" || figure.teamObj.id == "GoodBot") {
				bot.doTurn();
			}

			app.turnNumber++;
		},
		startGame: function() {
			app.gameStarted = true;
			app.turn();
		}
	}
});

app.initFigures();

document.querySelector("#splash").parentNode.removeChild(document.querySelector("#splash"));