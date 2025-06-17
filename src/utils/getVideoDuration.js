import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegStatic); // Tell fluent-ffmpeg where ffmpeg binary is
ffmpeg.setFfprobePath(ffprobeStatic.path); // Set ffprobe binary path

const getVideoDurationInSeconds = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration;
      resolve(duration); // in seconds
    });
  });
};

export {getVideoDurationInSeconds}