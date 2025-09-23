import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Grid, Typography, Modal, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageGallery from 'react-image-gallery';
import { theme } from '../../../theme/theme';

import 'react-image-gallery/styles/css/image-gallery.css';

const smallImages = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
  borderRadius: '5px',
  cursor: 'pointer'
};

const HeroImages = ({ images }) => {
  const { t } = useTranslation();

  const [openModal, setOpenModal] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [openGallery, setOpenGallery] = useState(false);

  // Prepare images for react-image-gallery
  const galleryImages = images.map((img) => ({
    original: img,
    thumbnail: img
  }));

  // Split images for left and right columns
  const leftColumnImages = images.slice(1, 3); // images[1], images[2]
  const rightColumnImages = images.slice(3, 5); // images[3], images[4]

  // Prepare rows for the modal with the specified pattern
  const rows = [];
  let i = 0;
  let rowIndex = 0;

  while (i < images.length) {
    if (rowIndex % 2 === 0) {
      // Rows with index 0, 2, 4... (First, Third, Fifth...) - 1 image full width
      rows.push([{ src: images[i], index: i }]);
      i += 1;
    } else {
      // Rows with index 1, 3, 5... (Second, Fourth, Sixth...) - 2 images half width
      if (i + 1 < images.length) {
        rows.push([
          { src: images[i], index: i },
          { src: images[i + 1], index: i + 1 }
        ]);
        i += 2;
      } else {
        // If only one image is left, add it as a full-width row
        rows.push([{ src: images[i], index: i }]);
        i += 1;
      }
    }
    rowIndex += 1;
  }

  return (
    <>
      <Grid
        container
        spacing={1}
        sx={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          px: 5,
          alignItems: 'center',
          ml: 0
        }}
      >
        {/* First Grid Item (Unchanged) */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{
            position: 'relative',
            flexGrow: 1
          }}
        >
          <Typography
            sx={{
              position: 'absolute',
              top: 20,
              left: 30,
              color: 'white',
              backgroundColor: '#30a46c',
              px: 1,
              py: 0.5,
              borderRadius: '5px',
              fontSize: '12px'
            }}
          >
            {t('Available')}
          </Typography>
          <img
            onClick={() => {
              setGalleryIndex(0);
              setOpenGallery(true);
            }}
            style={{
              width: '100%',
              borderRadius: '5px',
              height: '410px',
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            src={images[0]}
            alt="homeai"
          />
        </Grid>

        {/* Second Grid Item with Mapped Images */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: 'flex',
            height: '100%',
            flexGrow: 1,
            columnGap: 1
          }}
        >
          {/* Left Column */}
          <Box
            sx={{
              width: '50%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              gap: 0.5
            }}
          >
            {leftColumnImages.map((src, index) => (
              <Box
                key={index}
                sx={{
                  width: '100%',
                  height: '100%'
                }}
              >
                <img
                  style={smallImages}
                  src={src}
                  alt="homeai"
                  onClick={() => {
                    setGalleryIndex(index + 1);
                    setOpenGallery(true);
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Right Column */}
          <Box
            sx={{
              width: '48%',
              height: '50%',
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 1,
              gap: 0.5
            }}
          >
            {rightColumnImages.map((src, index) => {
              const isLastImage = index === rightColumnImages.length - 1;
              const imageIndex = index + 3; // Adjust index for gallery
              return (
                <Box
                  key={index}
                  sx={{
                    width: '100%',
                    height: '100%',
                    position: isLastImage ? 'relative' : undefined
                  }}
                >
                  <img
                    style={smallImages}
                    src={src}
                    alt="homeai"
                    onClick={() => {
                      setGalleryIndex(imageIndex);
                      setOpenGallery(true);
                    }}
                  />
                  {/* Overlay on the last image */}
                  {isLastImage && (
                    <Typography
                      sx={{
                        color: 'white',
                        position: 'absolute',
                        bottom: 10,
                        right: 15,
                        backgroundColor: '#8b8d98',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: '5px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        [theme.breakpoints.down('sm')]: {
                          px: 0.5,
                          fontSize: '10px'
                        }
                      }}
                      onClick={() => setOpenModal(true)}
                    >
                      {t('See all')} {images.length} {t('photos')}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Grid>
      </Grid>

      {/* Modal for All Images */}
      <Modal
        id="ModalForAllImages"
        open={openModal}
        onClose={() => setOpenModal(false)}
        sx={{ overflow: 'auto' }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxHeight: '100vh',
            backgroundColor: 'background.paper',
            boxShadow: 24,
            px: 2,
            overflowY: 'auto',
            outline: 'none',
            border: 'none'
          }}
        >
          <Box
            sx={{
              top: -1,
              position: 'sticky',
              width: '100%',
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'end'
            }}
          >
            <IconButton size="small" onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Map over rows to display images */}
          {rows.map((row, rowIndex) => (
            <Box key={rowIndex} sx={{ display: 'flex', mb: 2, gap: 2 }}>
              {row.length === 1 ? (
                // Full-width image
                <img
                  src={row[0].src}
                  alt={row[0].index}
                  style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
                  onClick={() => {
                    setGalleryIndex(row[0].index);
                    setOpenGallery(true);
                    setOpenModal(false);
                  }}
                />
              ) : (
                // Two half-width images
                row.map((imageObj, indexInRow) => (
                  <Box key={indexInRow} sx={{ width: '50%' }}>
                    <img
                      src={imageObj.src}
                      alt={imageObj.index}
                      style={{
                        width: '100%',
                        height: 'auto',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setGalleryIndex(imageObj.index);
                        setOpenGallery(true);
                        setOpenModal(false);
                      }}
                    />
                  </Box>
                ))
              )}
            </Box>
          ))}
        </Box>
      </Modal>

      {/* Fullscreen Image Gallery */}
      {openGallery && (
        <Modal
          open={openGallery}
          onClose={() => setOpenGallery(false)}
          sx={{ overflow: 'auto', outline: 'none', border: 'none' }}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconButton
              onClick={() => setOpenGallery(false)}
              sx={{ position: 'absolute', top: 10, right: 10, color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ width: '80%', height: '80%' }}>
              <ImageGallery
                items={galleryImages}
                startIndex={galleryIndex}
                showThumbnails={false}
                showFullscreenButton={false}
                showPlayButton={false}
                onSlide={(currentIndex) => setGalleryIndex(currentIndex)}
                additionalClass="fullscreen-gallery"
              />
            </Box>
          </Box>
        </Modal>
      )}
    </>
  );
};

export default HeroImages;
