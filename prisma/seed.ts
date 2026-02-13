import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const syllabusData: Record<string, any> = {
    "Physics": {
        "Physics and Measurement": [
            "Units and Dimensions",
            "Dimensional Analysis",
            "Measurement Errors",
            "Significant Figures"
        ],
        "Kinematics": [
            "Motion in One Dimension",
            "Motion in Two Dimensions",
            "Relative Velocity",
            "Projectile Motion"
        ],
        "Laws of Motion": [
            "Newton’s Laws of Motion",
            "Friction",
            "Circular Motion",
            "Dynamics of Uniform Circular Motion"
        ],
        "Work, Energy and Power": [
            "Work and Kinetic Energy",
            "Work-Energy Theorem",
            "Potential Energy",
            "Conservation of Energy",
            "Power"
        ],
        "Rotational Motion": [
            "Centre of Mass",
            "Moment of Inertia",
            "Torque",
            "Angular Momentum",
            "Rolling Motion"
        ],
        "Gravitation": [
            "Universal Law of Gravitation",
            "Acceleration due to Gravity",
            "Kepler’s Laws",
            "Satellite Motion"
        ],
        "Properties of Solids and Liquids": [
            "Elastic Behaviour",
            "Fluid Pressure",
            "Viscosity",
            "Surface Tension"
        ],
        "Thermodynamics": [
            "Thermal Equilibrium",
            "First Law of Thermodynamics",
            "Second Law of Thermodynamics",
            "Heat Engines",
            "Refrigerators"
        ],
        "Oscillations and Waves": [
            "Simple Harmonic Motion",
            "Wave Motion",
            "Sound Waves",
            "Doppler Effect"
        ],
        "Electrostatics": [
            "Coulomb’s Law",
            "Electric Field",
            "Electric Potential",
            "Capacitance"
        ],
        "Current Electricity": [
            "Ohm’s Law",
            "Kirchhoff’s Laws",
            "Electric Power",
            "Wheatstone Bridge"
        ],
        "Magnetic Effects of Current": [
            "Biot-Savart Law",
            "Ampere’s Law",
            "Lorentz Force",
            "Moving Coil Galvanometer"
        ],
        "Electromagnetic Induction": [
            "Faraday’s Law",
            "Lenz’s Law",
            "Self Induction",
            "AC Generator"
        ],
        "Optics": [
            "Reflection",
            "Refraction",
            "Interference",
            "Diffraction",
            "Optical Instruments"
        ],
        "Modern Physics": [
            "Photoelectric Effect",
            "Atomic Models",
            "Nuclear Physics",
            "Semiconductors"
        ]
    },

    "Chemistry": {
        "Physical Chemistry": {
            "Some Basic Concepts": [
                "Mole Concept",
                "Stoichiometry",
                "Empirical Formula"
            ],
            "Atomic Structure": [
                "Bohr Model",
                "Quantum Numbers",
                "Electronic Configuration"
            ],
            "Thermodynamics": [
                "First Law",
                "Enthalpy",
                "Entropy",
                "Gibbs Free Energy"
            ],
            "Equilibrium": [
                "Chemical Equilibrium",
                "Ionic Equilibrium",
                "pH",
                "Buffer Solutions"
            ],
            "Electrochemistry": [
                "Electrode Potential",
                "Nernst Equation",
                "Electrolysis"
            ],
            "Chemical Kinetics": [
                "Rate Laws",
                "Order of Reaction",
                "Arrhenius Equation"
            ]
        },
        "Inorganic Chemistry": {
            "Periodic Table": [
                "Periodic Trends",
                "Ionization Enthalpy",
                "Electron Affinity"
            ],
            "Chemical Bonding": [
                "VSEPR Theory",
                "Hybridization",
                "Molecular Orbital Theory"
            ],
            "p-Block Elements": [
                "Group 13-18 Elements",
                "Oxides and Oxyacids"
            ],
            "d and f Block Elements": [
                "Transition Elements",
                "Lanthanides and Actinides"
            ],
            "Coordination Compounds": [
                "Werner’s Theory",
                "Isomerism",
                "Crystal Field Theory"
            ]
        },
        "Organic Chemistry": {
            "General Organic Chemistry": [
                "Inductive Effect",
                "Resonance",
                "Hyperconjugation",
                "Acidity and Basicity"
            ],
            "Hydrocarbons": [
                "Alkanes",
                "Alkenes",
                "Alkynes",
                "Aromatic Compounds"
            ],
            "Haloalkanes and Haloarenes": [
                "SN1 and SN2",
                "Elimination Reactions"
            ],
            "Alcohols, Phenols and Ethers": [
                "Preparation",
                "Reactions",
                "Acidity of Phenols"
            ],
            "Carbonyl Compounds": [
                "Aldehydes",
                "Ketones",
                "Carboxylic Acids",
                "Named Reactions"
            ],
            "Biomolecules": [
                "Carbohydrates",
                "Proteins",
                "Polymers"
            ]
        }
    },

    "Mathematics": {
        "Algebra": [
            "Complex Numbers",
            "Quadratic Equations",
            "Matrices and Determinants",
            "Sequences and Series",
            "Binomial Theorem",
            "Permutations and Combinations",
            "Probability"
        ],
        "Trigonometry": [
            "Trigonometric Identities",
            "Inverse Trigonometric Functions",
            "Heights and Distances"
        ],
        "Coordinate Geometry": [
            "Straight Lines",
            "Circles",
            "Parabola",
            "Ellipse",
            "Hyperbola"
        ],
        "Calculus": [
            "Limits and Continuity",
            "Differentiation",
            "Applications of Derivatives",
            "Integration",
            "Differential Equations"
        ],
        "Vectors and 3D Geometry": [
            "Vector Algebra",
            "Dot Product",
            "Cross Product",
            "Line and Plane in 3D"
        ]
    }
};

async function main() {
    console.log('Start seeding ...');

    for (const subjectName of Object.keys(syllabusData)) {
        const categoriesOrTopics = syllabusData[subjectName];

        // Create Subject
        const subject = await prisma.subject.upsert({
            where: { name: subjectName },
            update: {},
            create: { name: subjectName },
        });
        console.log(`Processing Subject: ${subjectName}`);

        // Helper function to create Topic + Subtopics
        const createTopicAndSubtopics = async (topicName: string, subtopicsList: string[]) => {
            // Create Topic
            const topic = await prisma.topic.upsert({
                where: {
                    name_subjectId: {
                        name: topicName,
                        subjectId: subject.id,
                    },
                },
                update: {},
                create: {
                    name: topicName,
                    subjectId: subject.id,
                },
            });

            // Create Subtopics
            for (const subtopicName of subtopicsList) {
                await prisma.subtopic.upsert({
                    where: {
                        name_topicId: {
                            name: subtopicName,
                            topicId: topic.id,
                        },
                    },
                    update: {},
                    create: {
                        name: subtopicName,
                        topicId: topic.id,
                    },
                });
            }
        };

        // Determine if the structure is flat (Physics/Maths) or nested (Chemistry)
        // Check if the first value in categoriesOrTopics is an Array
        const firstValue = Object.values(categoriesOrTopics)[0];

        if (Array.isArray(firstValue)) {
            // Flat Structure: Key=Topic, Value=Subtopics[]
            for (const [topicName, subtopics] of Object.entries(categoriesOrTopics as Record<string, string[]>)) {
                await createTopicAndSubtopics(topicName, subtopics);
            }
        } else {
            // Nested Structure: Key=Category, Value={ Topic: Subtopics[] }
            // We will flatten this: Just verify the inner structure
            for (const [categoryName, topicsMap] of Object.entries(categoriesOrTopics as Record<string, Record<string, string[]>>)) {
                // topicsMap is like { "Atomic Structure": [...] }
                for (const [topicName, subtopics] of Object.entries(topicsMap)) {
                    // We can optionally prepend categoryName if we want unique topic names across categories?
                    // But JEE topics are usually distinct enough. 
                    // Let's just use the topic name directly.
                    await createTopicAndSubtopics(topicName, subtopics);
                }
            }
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
