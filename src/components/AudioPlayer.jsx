import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Radio, ListMusic, ExternalLink } from 'lucide-react';

export default function AudioPlayer({ mixes = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [showTracklist, setShowTracklist] = useState(false);

  const audioRef = useRef(null);
  const currentMix = mixes[currentIndex] || mixes[0];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && currentMix?.audio_url) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex, currentMix]);

  const togglePlay = () => {
    if (!audioRef.current || !currentMix?.audio_url) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(true));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleNext = () => {
    if (mixes.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % mixes.length);
    }
  };

  const handlePrev = () => {
    if (mixes.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + mixes.length) % mixes.length);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section id="mixes" className="audio-player-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Audio & Sets</span>
          <h2 className="section-title">THE SOUND VAULT</h2>
          <p className="section-subtitle">
            Curated club recordings and live Afro-urban sets by DJ Samizen.
          </p>
        </div>

        {mixes.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-hub">
              <Radio size={32} />
            </div>
            <h3 className="empty-title">No mixes available yet.</h3>
            <p className="empty-sub">
              Studio sessions and live sets will appear here once published.
            </p>
          </div>
        ) : (
          <div className="player-master-card">
            {currentMix?.audio_url && (
              <audio
                ref={audioRef}
                src={currentMix.audio_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleTimeUpdate}
                onEnded={handleNext}
              />
            )}

            <div className="player-grid">
              {/* Left: Artwork / Vinyl representation */}
              <div className="player-artwork-wrap">
                {currentMix?.artwork_url ? (
                  <img
                    src={currentMix.artwork_url}
                    alt={currentMix.title}
                    className={`player-art-img ${isPlaying ? 'spinning-art' : ''}`}
                  />
                ) : (
                  <div className={`player-art-placeholder ${isPlaying ? 'spinning-art' : ''}`}>
                    <div className="vinyl-hub">
                      <Radio size={24} className="hub-icon" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Controls & Metadata */}
              <div className="player-controls-wrap">
                <div className="player-meta-top">
                  <div className="meta-badge-row">
                    {currentMix?.genre && <span className="genre-badge">{currentMix.genre}</span>}
                    {currentMix?.duration && <span className="duration-badge">{currentMix.duration}</span>}
                  </div>
                  <h3 className="track-title">{currentMix?.title || 'Live Recording'}</h3>
                  <p className="artist-credit">DJ Samizen</p>
                </div>

                {/* Frequency waveform bars */}
                <div className="waveform-container">
                  {[20, 35, 55, 75, 45, 85, 95, 60, 40, 70, 90, 50, 30, 65, 80, 100, 70, 45, 30, 70, 85, 50, 35, 60].map((height, i) => (
                    <span
                      key={i}
                      className={`wave-bar ${isPlaying ? 'wave-active' : ''}`}
                      style={{
                        height: isPlaying ? `${Math.max(15, (height * (Math.sin((i + currentTime * 2) * 0.5) + 1.2)) % 90)}%` : '18%'
                      }}
                    ></span>
                  ))}
                </div>

                {/* Progress Slider (if audio_url exists) */}
                {currentMix?.audio_url && (
                  <div className="time-scrub-row">
                    <span className="time-display">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="progress-slider"
                      aria-label="Audio scrubber"
                    />
                    <span className="time-display">{duration ? formatTime(duration) : currentMix.duration || '00:00'}</span>
                  </div>
                )}

                {/* Controls */}
                <div className="control-buttons-row">
                  {mixes.length > 1 && (
                    <button onClick={handlePrev} className="ctrl-btn" aria-label="Previous Track">
                      <SkipBack size={20} />
                    </button>
                  )}

                  {currentMix?.audio_url && (
                    <button onClick={togglePlay} className="ctrl-play-btn" aria-label={isPlaying ? 'Pause' : 'Play'}>
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="play-icon-offset" />}
                    </button>
                  )}

                  {mixes.length > 1 && (
                    <button onClick={handleNext} className="ctrl-btn" aria-label="Next Track">
                      <SkipForward size={20} />
                    </button>
                  )}

                  {currentMix?.audio_url && (
                    <div className="volume-control-group">
                      <button onClick={() => setIsMuted(!isMuted)} className="ctrl-btn-mini" aria-label="Mute toggle">
                        {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                          setIsMuted(false);
                        }}
                        className="volume-slider"
                        aria-label="Volume slider"
                      />
                    </div>
                  )}

                  {currentMix?.tracklist && (
                    <button
                      onClick={() => setShowTracklist(!showTracklist)}
                      className={`ctrl-btn-mini tracklist-toggle ${showTracklist ? 'active' : ''}`}
                      title="View Tracklist"
                    >
                      <ListMusic size={16} />
                    </button>
                  )}

                  {currentMix?.stream_url && (
                    <a
                      href={currentMix.stream_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ctrl-btn-mini"
                      title="Stream External"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                {showTracklist && currentMix?.tracklist && (
                  <div className="tracklist-box">
                    <h4 className="tracklist-heading">Tracklist:</h4>
                    <p className="tracklist-text">{currentMix.tracklist}</p>
                  </div>
                )}
              </div>
            </div>

            {mixes.length > 1 && (
              <div className="mix-selector-row">
                <span className="playlist-label">Mixes:</span>
                <div className="mix-pill-container">
                  {mixes.map((mix, idx) => (
                    <button
                      key={mix.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsPlaying(true);
                      }}
                      className={`mix-pill ${currentIndex === idx ? 'active' : ''}`}
                    >
                      <span className="pill-number">0{idx + 1}</span>
                      <span className="pill-title">{mix.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
