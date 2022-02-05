/** @jsxRuntime classic */
/** @jsx jsx */
import {jsx} from 'theme-ui'
import {Fragment, useState, useEffect} from 'react'
import router from 'next/router'
import axios from 'axios'
import Search from '../components/Search'
import Results from '../components/Results'
import Loader from '../components/Loader'
import Layout from '../components/Layout'
import {trackGAEvent} from '../utils/googleAnalytics'
import Button from '../components/Button'
import {dateNow} from '../utils/date'

const SEARCH_TYPES = {
  video: 'video',
  playlist: 'playlist',
}

const Input = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState(SEARCH_TYPES.video)
  const [data, setData] = useState(undefined)
  const [error, setError] = useState(undefined)
  const [loading, setLoading] = useState(false)

  const getPlaceholder = () => {
    return searchType === SEARCH_TYPES.video
      ? 'Type something or paste a youtube video link'
      : 'Paste a youtube playlist link or ID'
  }

  // grab the ID of the playlist in a YT URL
  const getPlaylistID = () => {
    const regex = /(?:\&list=|\?list=|be\/)(\w*)/
    if (searchTerm.includes('.')) {
      const [, id] = searchTerm.match(regex)
      return id
    }
    return searchTerm
  }

  const fetchResults = () => {
    setLoading(true)
    const URL =
      searchType === SEARCH_TYPES.video ? '/api/search' : '/api/playlist'
    const search =
      searchType === SEARCH_TYPES.video ? searchTerm : getPlaylistID()
    axios
      .get(URL, {params: {searchTerm: search}})
      .then((res) => {
        updateDataError(res.data, undefined)
      })
      .catch((error) => {
        updateDataError(undefined, error)
      })
      .finally(() => setLoading(false))
  }

  const updateDataError = (data, error) => {
    setData(data)
    setError(error)
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  /**
   * create a playlist with name 'Untitled' or 'Untitled-copy' or 'Untitled-copy-copy-..'
   * @param {String} name
   * @param {Object} playlists
   * @returns {String}
   */
  const createPlaylistName = (name, playlists) => {
    if (!playlists[name]) {
      return name
    } else {
      return createPlaylistName(`${name}-copy`, playlists)
    }
  }

  const createPlaylist = () => {
    const playlists = JSON.parse(localStorage.getItem('playlists'))
    const name = createPlaylistName('Untitled', playlists)
    const videos = data?.items.map((video) => ({
      ...video,
      start: 0,
      end: 0,
      id: video?.snippet?.resourceId?.videoId || video.id,
    }))
    let playlist = {
      name,
      created: dateNow(),
      videos,
    }
    playlists[name] = playlist
    localStorage.setItem('playlists', JSON.stringify(playlists))
    router.push({
      pathname: '/playlist',
      query: {id: name},
    })
  }

  useEffect(() => {
    if (searchTerm.trim()) {
      trackGAEvent('search', `search for ${searchTerm}`, 'search input')
      fetchResults()
    }
    return () => {}
  }, [searchTerm])

  useEffect(() => {
    setData(undefined)
    setSearchTerm('')
    return () => {}
  }, [searchType])

  return (
    <Layout title='Search'>
      <div sx={{bg: 'background'}}>
        <div
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 0,
            fontSize: [3, 4, 5],
          }}>
          <h2>
            <Button
              primary={{
                bg: searchType === SEARCH_TYPES.video ? 'shade1' : 'background',
                color: 'text',
              }}
              action={() => setSearchType(SEARCH_TYPES.video)}>
              Video
            </Button>
          </h2>
          <h2>
            <Button
              primary={{
                bg:
                  searchType === SEARCH_TYPES.playlist
                    ? 'shade1'
                    : 'background',
                color: 'text',
              }}
              action={() => setSearchType(SEARCH_TYPES.playlist)}>
              Playlist
            </Button>
          </h2>
        </div>
        <Search
          searchTerm={searchTerm}
          placeholder={getPlaceholder()}
          updateSearch={handleSearch}
        />
        {loading ? (
          <Loader />
        ) : (
          <Fragment>
            {data?.items?.length && searchType === SEARCH_TYPES.playlist && (
              <div
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 5,
                  mb: -4,
                }}>
                <Button
                  primary={{bg: 'shade2', color: 'text'}}
                  hover={{bg: 'shade1', color: 'accent'}}
                  action={createPlaylist}>
                  Create a playlist
                </Button>
              </div>
            )}
            <Results data={data} error={error} />
          </Fragment>
        )}
      </div>
    </Layout>
  )
}

export default Input
