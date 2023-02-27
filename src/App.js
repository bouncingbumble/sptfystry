import React, { useEffect, useState } from 'react'
import axios from 'axios'
import * as htmlToImage from 'html-to-image'
import download from 'downloadjs'

function App() {
    const CLIENT_ID = process.env.REACT_APP_SPOT_CLIENT_ID
    const REDIRECT_URI = 'http://localhost:3000'
    const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
    const RESPONSE_TYPE = 'token'

    const [user, setUser] = useState(null)
    const [playlists, setPlaylists] = useState(null)
    const [tracks, setTracks] = useState(null)

    useEffect(() => {
        const hash = window.location.hash
        let token = window.localStorage.getItem('token')

        if (!token && hash) {
            token = hash
                .substring(1)
                .split('&')
                .find((elem) => elem.startsWith('access_token'))
                .split('=')[1]

            window.location.hash = ''
            window.localStorage.setItem('token', token)
        }

        setTokenHeader(token)
        getUser().then((data) => getUsersPlaylists(data))
    }, [])

    const logout = () => {
        setTokenHeader('')
        window.localStorage.removeItem('token')
    }

    const getUser = async () => {
        const data = await apiCall('GET', 'me', {
            params: {
                q: '',
                type: '',
            },
        })

        setUser(data)
        return data
    }

    const getUsersPlaylists = async (userData) => {
        const data = await apiCall('GET', `users/${userData.id}/playlists`)

        setPlaylists(data)
    }

    const getPlaylistTracks = async (playlistId) => {
        const data = await apiCall('GET', `playlists/${playlistId}/tracks`)
        setTracks(data.items.map((i) => i.track))
    }

    const downloadStory = () => {
        htmlToImage
            .toPng(document.getElementById('story'))
            .then(function (dataUrl) {
                download(dataUrl, 'my-node.png')
            })
    }

    return (
        <div className="App">
            {!window.localStorage.getItem('token') && (
                <a
                    href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}
                >
                    Login to Spotify
                </a>
            )}
            {user !== null && (
                <div className="container">
                    <div className="navbar">
                        <div className="avatar">
                            <img
                                src={`${user.images[0].url}`}
                                height="64px"
                                alt=""
                                style={{
                                    borderRadius: '50%',
                                    marginRight: 16,
                                }}
                            />
                            <div>{user.display_name}</div>
                        </div>
                        <div>
                            {playlists !== null && (
                                <button onClick={downloadStory}>
                                    download story
                                </button>
                            )}
                            <button onClick={logout} style={{ height: 24 }}>
                                Logout
                            </button>
                        </div>
                    </div>
                    <div className="main">
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <b>Click a playlist to generate story</b>
                                {playlists !== null &&
                                    playlists.items.map((p) => (
                                        <div
                                            id={p.id}
                                            onClick={() =>
                                                getPlaylistTracks(p.id)
                                            }
                                            className="playlistName"
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                            </div>
                            <div
                                id="story"
                                style={{
                                    width: 400,
                                    backgroundColor: '#FFFFFF',
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: '#1E7ECC',
                                        marginBottom: 24,
                                        paddingTop: 60,
                                        paddingBottom: 36,
                                        paddingLeft: 24,
                                    }}
                                >
                                    <div
                                        style={{
                                            color: '#DDB834',
                                            fontSize: 16,
                                        }}
                                    >
                                        THIS WEEK
                                    </div>
                                    <div
                                        style={{
                                            color: '#FFFFFF',
                                            fontSize: 22,
                                            fontFamily: 'serif',
                                            fontWeight: 600,
                                            marginTop: 8,
                                        }}
                                    >
                                        what we're listening to
                                    </div>
                                </div>
                                <div
                                    style={{
                                        maxWidth: '100%',
                                        paddingLeft: 16,
                                        paddingRight: 16,
                                    }}
                                >
                                    {tracks !== null &&
                                        tracks.map((t) => (
                                            <div className="track-container">
                                                <img
                                                    src={`${t.album.images[2].url}`}
                                                    alt=""
                                                    srcset=""
                                                    height="48px"
                                                    style={{
                                                        marginRight: 16,
                                                        borderRadius: '50%',
                                                    }}
                                                />
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent:
                                                            'space-between',
                                                        alignItems: 'center',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection:
                                                                'column',
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize: 16,
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {t.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            {t.album.artists.map(
                                                                (a) => a.name
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        {msToSeconds(
                                                            t.duration_ms
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App

export const setTokenHeader = (token) => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
        delete axios.defaults.headers.common['Authorization']
    }
}

export const apiCall = async (method, path, data, config, params) => {
    try {
        const res = await axios[method.toLowerCase()](
            `https://api.spotify.com/v1/${path}`,
            data,
            config,
            params
        )
        return res.data
    } catch (err) {
        throw err.response
    }
}

const msToSeconds = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000) // 1 minute
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0) // 23 seconds
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}
