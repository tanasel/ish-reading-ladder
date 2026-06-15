(function () {
  "use strict";

  // A worked example so teachers can see the output before building their own.
  // wordCount is left at 0 — the normaliser computes the true count from the passage.
  window.EAL_SAMPLE = {
    source:
      "Water is always moving around our planet in a continuous process called the water cycle. " +
      "The Sun's heat causes water in oceans, lakes and rivers to evaporate, turning it from a liquid " +
      "into an invisible gas called water vapour. As this vapour rises into the cooler air high above " +
      "the ground, it condenses into tiny droplets that gather to form clouds. When the droplets become " +
      "heavy enough, they fall back to Earth as precipitation — rain, snow, sleet or hail. Some of this " +
      "water soaks into the ground and is absorbed by plants, while the rest flows across the land as " +
      "run-off, collecting in rivers that eventually carry it back to the sea. There the cycle begins again. " +
      "Because no new water is ever created, the water you drink today may have fallen as rain on dinosaurs " +
      "millions of years ago.",
    pack: {
      schema: "ish-eal@1",
      meta: { title: "The Water Cycle", topic: "Science — Year 8", sourceWords: 142 },
      levels: [
        {
          phase: "Phase 1",
          cefr: "Pre-A1 / A1",
          audience: "New to English",
          summary: "Water moves around the Earth. The Sun lifts it up to the sky. It falls back down as rain.",
          wordCount: 0,
          passage:
            "Water moves around the Earth. We call this the water cycle.\n\n" +
            "The Sun heats the sea. The water goes up to the sky. Up high it is cold. " +
            "The water makes clouds.\n\n" +
            "Then rain falls down. Rain goes into the ground. Plants drink the water. " +
            "Rivers take water to the sea. Then it starts again.",
          glossary: [
            { word: "water cycle", definition: "How water moves around the Earth again and again.", example: "Rain is part of the water cycle.", translation: "" },
            { word: "cloud", definition: "White or grey water that floats in the sky.", example: "I see a big cloud.", translation: "" },
            { word: "rain", definition: "Water that falls from the sky.", example: "Take a coat. It is rain.", translation: "" },
            { word: "river", definition: "A long line of water on the land.", example: "The river goes to the sea.", translation: "" }
          ],
          questions: [
            { q: "What heats the sea?", type: "literal", answer: "The Sun." },
            { q: "Where does the water go after the sea?", type: "literal", answer: "Up to the sky." },
            { q: "What falls from the clouds?", type: "literal", answer: "Rain." }
          ],
          starters: ["The Sun heats", "Rain falls from", "Plants drink"]
        },
        {
          phase: "Phase 2",
          cefr: "A1 / A2",
          audience: "Beginning",
          summary: "Water keeps moving around the Earth. The Sun turns sea water into a gas that rises and makes clouds. The clouds bring rain that runs back to the sea.",
          wordCount: 0,
          passage:
            "Water moves around the Earth all the time. We call this the water cycle.\n\n" +
            "The Sun heats the water in the sea. The water turns into a gas. The gas goes up into the sky. " +
            "Up high, the air is cold. The gas turns back into small drops of water. The drops make clouds.\n\n" +
            "The drops get bigger and heavier. Then they fall down as rain. Some rain goes into the ground, " +
            "and plants drink this water. The rest runs into rivers. The rivers carry the water back to the sea. " +
            "Then it all happens again.",
          glossary: [
            { word: "the water cycle", definition: "The way water keeps moving from the sea to the sky and back.", example: "We learned about the water cycle in science.", translation: "" },
            { word: "gas", definition: "Something like air that you cannot see.", example: "Water can turn into a gas when it is hot.", translation: "" },
            { word: "drops", definition: "Very small, round bits of water.", example: "Drops of rain fell on my hand.", translation: "" },
            { word: "carry", definition: "To take something from one place to another.", example: "Rivers carry water to the sea.", translation: "" }
          ],
          questions: [
            { q: "What do we call the way water moves around the Earth?", type: "literal", answer: "The water cycle." },
            { q: "Why does the gas turn back into drops high in the sky?", type: "inferential", answer: "Because the air up high is cold." },
            { q: "What carries the water back to the sea?", type: "literal", answer: "Rivers." }
          ],
          starters: ["First, the Sun", "Next, the gas", "Finally, the rivers"]
        },
        {
          phase: "Phase 3",
          cefr: "A2 / B1",
          audience: "Developing",
          summary: "Water moves around the Earth in a cycle. The Sun evaporates it, it condenses into clouds, and it falls as precipitation. The same water is used again and again.",
          wordCount: 0,
          passage:
            "Water moves around the Earth all the time, in a process called the water cycle.\n\n" +
            "The Sun heats the water in the oceans, lakes and rivers. The water changes into a gas called " +
            "water vapour. We call this evaporation. The vapour rises into the cooler air, where it turns " +
            "back into tiny drops of water and forms clouds. This is called condensation.\n\n" +
            "When the drops become heavy, they fall as rain or snow. We call this precipitation. Some of the " +
            "water sinks into the ground and feeds plants, while the rest runs into rivers and flows back to " +
            "the sea. Then the cycle starts again. No new water is ever made, so the same water is used again and again.",
          glossary: [
            { word: "evaporation", definition: "When a liquid is heated and changes into a gas.", example: "Evaporation happens when the Sun heats the sea.", translation: "" },
            { word: "water vapour", definition: "Water in the form of a gas in the air.", example: "You cannot see water vapour.", translation: "" },
            { word: "condensation", definition: "When a gas cools and changes back into a liquid.", example: "Condensation forms the drops in a cloud.", translation: "" },
            { word: "precipitation", definition: "Water that falls from clouds, such as rain or snow.", example: "Rain and snow are types of precipitation.", translation: "" },
            { word: "feeds", definition: "Gives food or water to something so it can live.", example: "The rain feeds the plants.", translation: "" }
          ],
          questions: [
            { q: "Name the step where water changes from a liquid into a gas.", type: "literal", answer: "Evaporation." },
            { q: "Why do the drops of water fall from the clouds?", type: "inferential", answer: "Because they become too heavy to stay in the air." },
            { q: "Why is the water cycle important for plants and people?", type: "evaluative", answer: "It keeps giving fresh water for plants to grow and for people to drink, because the same water is used again and again." }
          ],
          starters: ["The water cycle is important because", "One step in the cycle is ____, which means", "I think the most interesting part is ____ because"]
        }
      ]
    }
  };
})();
