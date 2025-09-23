import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import SEOHelmet from '../../components/SEO/SEOHelmet';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme/theme';
import BasicLayout from '../Layout/BasicLayout';

const SearchProperty = () => {
  const { t } = useTranslation();

  return (
    <>
      <SEOHelmet
        title="Search Properties - HomeAI"
        description="Search for your perfect property with AI assistance"
      />
      <BasicLayout withPadding={false}>
        <Box
          sx={{
            width: '100%',
            backgroundColor: theme.palette.background.lightBlue,
            pt: 8,
            pb: 2
          }}>
          <Container
            maxWidth="md"
            sx={{
              [theme.breakpoints.down('sm')]: {
                px: 2
              }
            }}>
            <Typography variant="h5" fontWeight={700} fontSize={'35px'} align="center" gutterBottom>
              {t('Search Property')}
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Section: About HomeAI.CH */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('About HomeAI.CH')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What is the HomeAi.CH service?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        "It's a chat-based assistant designed to streamline your property search in Switzerland. After answering a few simple yet comprehensive questions, it instantly provides personalized property recommendations, clearly detailing why each option fits your specific requirements."
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How much does the assistant cost?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'You can try it free for 1 day. After the trial, unlimited access costs CHF 29.99 per month. You may cancel anytime, with no long-term commitment.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 3 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Which areas in Switzerland are covered?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'The assistant covers all Swiss cantons and municipalities—from major cities like Zurich, Geneva, Lausanne, and Basel to smaller towns and rural areas. Listings are updated multiple times daily to ensure accuracy.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Why the Assistant is Needed */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Why the Assistant is Needed')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Why use HomeAI instead of traditional search methods?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Searching for properties involves much more than just filtering by price or location. The AI Home-Search Assistant considers a broad spectrum of personal, practical, and financial factors simultaneously, providing benefits such as:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Highly personalized recommendations beyond basic filtering criteria')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t(
                            'Comprehensive understanding of your lifestyle, including commuting habits, family and social life, and essential amenities.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t(
                            'Detailed financial insights, accounting for total living costs, taxes, commuting expenses, and more.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t(
                            'Efficient search experience, saving you time by narrowing down truly suitable options.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ pl: 0.5, mt: 1 }}>
                      {t(
                        'The assistant helps you discover properties uniquely matched to your lifestyle that standard platforms might overlook.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How does the assistant save me time compared to manual searches?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        "The assistant instantly filters through thousands of listings daily, applying your detailed preferences and analyzing complex factors like total living costs, precise commute times, and lifestyle considerations. This significantly reduces the time you'd spend manually searching and comparing properties."
                      )}
                    </Typography>
                  </Box>
                  {/* Question 3 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How can the assistant help me avoid hidden costs?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'The assistant explicitly evaluates hidden or overlooked costs such as local taxes, commuting expenses, and utilities (heating, broadband availability, energy efficiency). You’ll receive transparent insights, preventing unexpected financial surprises.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 4 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How does the assistant improve decision-making accuracy?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'By considering over 60 detailed data points—including demographic data, environmental quality, local competition, transport accessibility, and detailed photo analysis—it ensures your choices are informed by comprehensive, accurate, and nuanced data, rather than guesswork or incomplete information.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 5 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t(
                        'How does the assistant ensure recommendations match my actual lifestyle?'
                      )}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        "Recommendations go far beyond basic filters, incorporating personal and practical details about your family, daily routines, and preferred amenities. Whether it's proximity to favorite restaurants, fitness centers, or a safer route for your children's school commute, the assistant ensures each recommendation closely aligns with your actual day-to-day life."
                      )}
                    </Typography>
                  </Box>
                  {/* Question 6 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Can the assistant uncover ideal locations I might not consider myself?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Yes. By evaluating comprehensive commute patterns and total living costs rather than just geographic proximity, the assistant frequently recommends excellent properties in locations you might otherwise overlook, enhancing your living quality or financial efficiency.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 7 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t(
                        'How does the assistant continuously improve the quality of its recommendations?'
                      )}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'The assistant actively integrates your feedback on each suggestion, refining future recommendations. This interactive feedback loop ensures the search results become increasingly precise and personalized over time.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 8 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How detailed are the insights provided about each property?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'The assistant delivers thorough, actionable insights for every recommended property, clearly explaining why each home fits your needs—including detailed financial breakdowns, lifestyle suitability, commute efficiency, and environmental quality assessments.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: How HomeAI.ch Works */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('How HomeAI.ch Works')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Why is this assistant better than traditional property websites?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Unlike standard property portals, which use basic filters (e.g., price, location, rooms), our assistant comprehensively considers detailed factors such as:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Total Living Costs:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Estimates your total monthly expenses, including cantonal and municipal taxes'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Commute and Transit:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Calculates precise commute times tailored to your preferred transport methods (public transit, car, or bicycle).'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Detailed Photo Analysis:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Highlights property features like natural lighting, views, balcony size, kitchen style, and overall aesthetic.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Quality-of-Life Indicators:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Assesses factors such as noise levels, air quality, proximity to green spaces, and broadband availability.'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Competition Analysis:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Evaluates market competitiveness based on local vacancy rates and housing demand pressures'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Proximity to Personal Interests:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'Evaluates convenience not only by distance but by travel time, based on your chosen mode of transportation and frequency of visits (e.g., family, friends, frequent destinations).'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span" sx={{ fontWeight: 700, color: '#000' }}>
                          {t('Family Considerations:')}
                        </Typography>{' '}
                        <Typography component="span">
                          {t(
                            'If you have young children, the assistant specifically analyzes proximity and safest routes to kindergartens, including whether children need to cross major roads. For families with older children, it calculates optimal school commute times and safety factors.'
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ pl: 0.5, mt: 1 }}>
                      {t(
                        "This comprehensive approach ensures you uncover ideal properties you'd likely miss using conventional search methods."
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How detailed is the interview process?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'The interview process is thorough and replicates having a personal real estate assistant. It covers:'
                      )}
                    </Typography>
                    <Box sx={{ pl: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box component="li">
                        <Typography component="span">{t('Location preferences')}</Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">{t('Property type and size')}</Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Budget and financial flexibility')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Living space and layout preferences')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Lifestyle considerations (favorite restaurants, gyms, amenities)')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t(
                            'Family needs (proximity and ease of access to family, schools, safety)'
                          )}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Commute preferences (transport mode and frequency of commute)')}
                        </Typography>
                      </Box>
                      <Box component="li">
                        <Typography component="span">
                          {t('Timelines and flexibility on various criteria')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ pl: 0.5, mt: 1 }}>
                      {t(
                        'The assistant integrates these nuanced details beyond simple filters, providing genuinely tailored recommendations.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 3 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('How many data points does HomeAi.CH consider?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'The assistant evaluates over 60 unique data points tailored to your specific preferences, ensuring personalized and precise recommendations. These encompass financial, demographic, geographic, transportation, local amenities, environmental aspects, and personal lifestyle factors.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 4 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('What types of questions will I need to answer?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Only essential questions, such as your budget, desired location(s), property type, preferred move-in date, pet-related needs, commuting habits, and key amenities (e.g., balcony, garden, elevator). All questions are concise, relevant, and user-friendly.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Personalization and Preference */}
              <Box sx={{ borderBottom: '1px solid #666666', pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Personalization and Preference')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Does the assistant remember my preferences?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Yes. With an active subscription, it securely stores your preferences (budget, preferred areas, essential home features). Future searches automatically apply these preferences, saving you valuable time.'
                      )}
                    </Typography>
                  </Box>
                  {/* Question 2 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Can I get alerts for new matching properties?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        'Absolutely. You instantly receive email notifications whenever new properties matching your criteria become available.'
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Section: Renting and Buying */}
              <Box sx={{  pb: 2 }}>
                <Typography
                  color="#000"
                  sx={{
                    fontSize: '22px',
                    fontWeight: 700,
                    mb: 2
                  }}>
                  {t('Renting and Buying')}
                </Typography>
                <Box display="flex" flexDirection="column" gap={1}>
                  {/* Question 1 */}
                  <Box>
                    <Typography
                      color="#000"
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700
                      }}>
                      {t('Does the assistant help both renters and buyers?')}
                    </Typography>
                    <Typography sx={{ pl: 0.5 }}>
                      {t(
                        "Yes. Recommendations adapt based on whether you're renting or buying. For buyers, it further considers property taxes, year of construction, renovation potential, mortgage options, and long-term investment value."
                      )}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>
      </BasicLayout>
    </>
  );
};

export default SearchProperty;
