const CAPTURE_PASSIVE = { capture: true, passive: true };

const audio = document.querySelector('audio');
const scrubber = document.querySelector('.scrubber');
const output = {
	frame: document.querySelector('output.frame'),
	totalFrames: document.querySelector('output.total-frames'),
	pointerX: document.querySelector('output.pointer-x'),
	pointerFrame: document.querySelector('output.pointer-frame'),
};

const fps = 24;
let totalFrames = 0;
let nextFrame = 0;


function log(key, value) {
	if (output[key]) {
		output[key].textContent = String(value);
	}
}


function setTotalFrames() {
	totalFrames = Math.ceil(audio.duration * fps);
	scrubber.style.setProperty('--frames', String(totalFrames));
	log('totalFrames', totalFrames);
}


function getCurrentFrame() {
	return Math.floor(audio.currentTime * fps) + 1;
}


function getTimeForFrame(frame) {
	// seek to middle of frame
	const halfFrameDuration = 0.5 / fps;
	// NOTE if we seek to >= video.duration, currentTime is reset to 0
	const maxTime = audio.duration - 0.000001;
	return Math.min((frame / fps) - halfFrameDuration, maxTime);
}


function syncScrubberToAudio() {
	const frame = getCurrentFrame();
	scrubber.style.setProperty('--frame', String(frame));
	log('frame', frame);
}


function rafAudioPlaying() {
	syncScrubberToAudio();
	if (!audio.paused) {
		window.requestAnimationFrame(rafAudioPlaying);
	}
}


function videoSeeked() {
	syncScrubberToAudio();
	seekNextFrame();
}


audio.addEventListener('play', rafAudioPlaying);
audio.addEventListener('seeked', videoSeeked);


function seekNextFrame() {
	if (audio.seeking) {
		// busy
		return;
	}
	if (nextFrame === 0) {
		return;
	}

	const frameTime = getTimeForFrame(nextFrame);
	if (audio.currentTime !== frameTime) {
		audio.currentTime = frameTime;
	}
}


function getFrameFromPointerX(x) {
	const bounds = scrubber.getBoundingClientRect();
	let frame = Math.ceil(((x - bounds.left) / bounds.width) * totalFrames);
	return Math.min(Math.max(frame, 1), totalFrames);
}


function scrubberPointerMove(event) {
	nextFrame = getFrameFromPointerX(event.clientX);
	seekNextFrame();
	log('pointerX', event.clientX);
	log('pointerFrame', nextFrame);
}


function scrubberPointerUp(event) {
	scrubber.removeEventListener('pointerup', scrubberPointerUp, CAPTURE_PASSIVE);
	scrubber.removeEventListener('pointermove', scrubberPointerMove, CAPTURE_PASSIVE);
	scrubberPointerMove(event);
}

function scrubberPointerDown() {
	scrubber.addEventListener('pointerup', scrubberPointerUp, CAPTURE_PASSIVE);
	scrubber.addEventListener('pointermove', scrubberPointerMove, CAPTURE_PASSIVE);
}


scrubber.addEventListener('pointerdown', scrubberPointerDown, CAPTURE_PASSIVE);
audio.addEventListener('focus', () => nextFrame = 0);


// init
function init() {
	audio.addEventListener('loadedmetadata', setTotalFrames, { once: true });
	if (audio.readyState >= 1) {
		audio.removeEventListener('loadedmetadata', setTotalFrames);
		setTotalFrames();
	} else {
		audio.load();
	}
}
init();
