var teams = {
    teams: [
        {
            id: "Bot",
            color: "#52A7C6"
        },
        {
            id: "You",
            color: "#C02F1E"
        },
        {
            id: "GoodBot",
            color: "#61C376"
        }
    ],
    figures: [
        {
            id: "wizard2",
            job: "wizard",
            tp: 72,
            mp: 50,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 3,
                c: 3
            },
            orientation: "right",
            action: [
                {
                    id: "move",
                    range: 3
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -10,
                    missRange: 0.2
                },
                {
                    id: "thunder",
                    range: 4,
                    tp: -25,
                    mpCost: 27,
                    missRange: 0.3
                }
            ],
            team: 1
        },
        {
            id: "wizard3",
            job: "wizard",
            tp: 72,
            mp: 50,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 2,
                c: 0
            },
            orientation: "right",
            action: [
                {
                    id: "move",
                    range: 3
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -10,
                    missRange: 0.2
                },
                {
                    id: "thunder",
                    range: 4,
                    tp: -25,
                    mpCost: 27,
                    missRange: 0.3
                }
            ],
            team: 2
        },
        {
            id: "boss2",
            tp: 130,
            mp: 30,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 5,
                c: 4
            },
            orientation: "top",
            action: [
                {
                    id: "move",
                    range: 2
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -30,
                    missRange: 0.2
                },
                {
                    id: "heal",
                    range: 2,
                    tp: 20,
                    mpCost: 6,
                    missRange: 0
                }
            ],
            team: 1
        },
        {
            id: "boss1",
            tp: 120,
            mp: 30,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 0,
                c: 4
            },
            orientation: "bottom",
            action: [
                {
                    id: "move",
                    range: 3
                },
                {
                    id: "fight",
                    range: 2,
                    tp: -20,
                    missRange: 0.2
                },
                {
                    id: "heal",
                    range: 4,
                    tp: 10,
                    mpCost: 7,
                    missRange: 0
                }
            ],
            team: 0
        },
        {
            id: "archer1",
            tp: 56,
            mp: 15,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 0,
                c: 3
            },
            orientation: "bottom",
            action: [
                {
                    id: "move",
                    range: 2
                },
                {
                    id: "fight",
                    range: 3,
                    tp: -15,
                    missRange: 0.2
                }
            ],
            team: 0
        },
        {
            id: "darkWizard2",
            job: "wizard",
            tp: 72,
            mp: 60,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 5,
                c: 1
            },
            orientation: "top",
            action: [
                {
                    id: "move",
                    range: 3
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -10,
                    missRange: 0.2
                },
                {
                    id: "fire",
                    range: 4,
                    tp: -27,
                    mpCost: 27,
                    missRange: 0.3
                }
            ],
            team: 1
        },
        {
            id: "archer2",
            tp: 52,
            mp: 15,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 5,
                c: 2
            },
            orientation: "top",
            action: [
                {
                    id: "move",
                    range: 2
                },
                {
                    id: "fight",
                    range: 2,
                    tp: -27,
                    missRange: 0.25
                }
            ],
            team: 1
        },
        {
            id: "soldier1",
            tp: 80,
            mp: 30,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 0,
                c: 2
            },
            orientation: "bottom",
            action: [
                {
                    id: "move",
                    range: 4
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -30,
                    missRange: 0.2
                }
            ],
            team: 0
        },
        {
            id: "priest1",
            tp: 30,
            mp: 40,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 1,
                c: 4
            },
            orientation: "bottom",
            action: [
                {
                    id: "move",
                    range: 3
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -8,
                    missRange: 0.23
                },
                {
                    id: "heal",
                    range: 5,
                    tp: 30,
                    mpCost: 8,
                    missRange: 0
                }
            ],
            team: 0
        },
        {
            id: "priest2",
            tp: 40,
            mp: 30,
            maxTp: null,
            maxMp: null,
            coordination: {
                r: 5,
                c: 3
            },
            orientation: "top",
            action: [
                {
                    id: "move",
                    range: 3
                },
                {
                    id: "fight",
                    range: 1,
                    tp: -8,
                    missRange: 0.23
                },
                {
                    id: "heal",
                    range: 5,
                    tp: 30,
                    mpCost: 8,
                    missRange: 0
                }
            ],
            team: 1
        }
    ]
};