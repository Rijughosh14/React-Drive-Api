import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router';


export const File = () => {

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [id, Setid] = useState(undefined)
  const [listData, SetlistData] = useState([])
  const [metaData, SetmetaData] = useState([])
  const [status, setStatus] = useState(undefined)



  useEffect(() => {
    const auth = searchParams.get('auth');
    if (auth === 'true') {
      const userid = searchParams.get('userid');
      Setid(userid)
    }
  }, []);

  //file list
  const listFile = async () => {
    try {
      
    const config = {
      method: 'get',
      url: '/file/list/' + id,
      withCredentials: true
    };

      const response = await axios(config);
    SetlistData(response.data)
    } catch (error) {
      console.log(error)
    }
    
  }


  //fileMetadata
  const listMetadata = async (e) => {
    try {
      const config = {
        method: 'get',
        url: '/file/meta/' + id + '/' + e.target.id,
        withCredentials: true
      };
      const response = await axios(config);
      const entries = Object.entries(response.data.data);
      SetmetaData(entries)
    } catch (error) {
      console.log(error)
    }
  }

  //file upload
  const handleUpload = async (e) => {
    if (!e.target.files[0]) {
      return;
    }
    setStatus('Please wait')

    try {
      const formdata = new FormData();
      formdata.append('filedata', e.target.files[0]);
      formdata.append('id', id);

      const res = await axios.post('/file/upload', formdata, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setStatus(res.data.message)
    }
    catch (err) {
      console.log(err)
    }
  };


  //delete File
  const deleteFile = async (e) => {
    setStatus('Please wait')
    try {
      const config = {
        method: 'get',
        url: '/file/delete/' + id + '/' + e.target.id,
        withCredentials: true
      };
      const res = await axios(config);
      setStatus(res.data.message)
    } catch (error) {
      console.log(error)
    }
    listFile()

  }



  return (
    //Implement functions to list files and folders, retrieve file metadata, upload files, and delete files.
    id && <>
      <label htmlFor="">List File and folder</label>
      <button onClick={listFile}>Click</button>
      <br />
      <label htmlFor="">upload File</label>
      <input type="file" onChange={(e) => handleUpload(e)} />


      <div>
        <p>
          List of Files and Folder.Click on the button to receive the metadata and delete to delete the file
        </p>
        <ul>
          {listData.map((data, index) => {
            return (
              <li key={index}>
                <button id={`${data.id}`} onClick={(e) => listMetadata(e)}>
                  {data.name}
                </button>
                <button id={`${data.id}`} onClick={(e) => deleteFile(e)}>
                  delete
                </button>
              </li>
            )
          })}
        </ul>
        <div>
          {status&&<>
          {status}
          </>}
        </div>
      </div>

      <div>
        <ul>
          {metaData.map(([key, value]) => {
            return (
              <li key={key}>{key}:{value}</li>
            )
          })}
        </ul>
      </div>
    </>

  )
}
