// process.env.YOUTUBE_API_V3
import axios from 'axios'
import videoData from '../../constants/videoData'

const video = (req, res) => {
  const {videoId} = req.query
  axios
    .get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&maxResults=20&key=${process.env.YOUTUBE_API_V3}`
    )
    .then((response) => res.status(200).json(response.data))
    .catch((error) => {
      if (error.response) {
        res.status(error.response.status).send(error.response.data)
      }
      res.send(error)
    })
  // res.status(200).json(videoData)
}

export default video