import * as dat from 'dat.gui';

const audioSources = await navigator.mediaDevices.enumerateDevices()
    .then((devices) => devices.filter((device) => device.kind === 'audioinput'))
    .catch((err) => {
    console.log(err);
    return [];
});


const setupAudio = async (selectedSource, n_bins) => {

    let stream = null;


    const analyser = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: selectedSource.deviceId } } })
        .then((s) => {
            stream = s;
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = n_bins;

            source.connect(analyser);
            console.log(analyser);

            return analyser;
        })
        .catch((err) => {
            console.log(err);
        });

    return [analyser, stream];
};

const createUI = (container) => {
    const gui = new dat.GUI({ autoPlace: false });
    container.appendChild(gui.domElement);
    return gui;
};

const addAudioInputToUI = (audioSources, gui, onChangeCallback) => {

    // Create an object to store the current audio source selection
    const audioSelection = { source: '' };
  
    // Create a controller for the audio source selection
    const controller = gui.add(audioSelection, 'source', audioSources.map((source, index) =>index));

    console.log(audioSources);
  
    // Add a change listener to the controller
    controller.onChange(function(value) {
      // Find the selected source from the audioSources array
      console.log(audioSources);
      console.log(value);
      const selectedSource = audioSources[value];
        console.log(selectedSource);
      // Call the callback function with the selected source
      onChangeCallback(selectedSource);
    });
  };

export { createUI, addAudioInputToUI, setupAudio, audioSources };