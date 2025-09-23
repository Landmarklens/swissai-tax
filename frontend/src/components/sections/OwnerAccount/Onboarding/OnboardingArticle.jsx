import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Box, Typography, Button, Chip, Paper, Divider, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { landlordArticles } from '../../../../landlordArticles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MermaidRenderer from './MermaidRenderer';
import ChartRenderer from './ChartRenderer';

const OnboardingArticle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    const foundArticle = landlordArticles.find(a => a.id === parseInt(id));
    if (foundArticle) {
      setArticle(foundArticle);
    } else {
      navigate('/owner-account/onboarding');
    }
  }, [id, navigate]);

  if (!article) {
    return null;
  }

  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      // Handle mermaid diagrams
      if (language === 'mermaid') {
        return (
          <MermaidRenderer chart={String(children).replace(/\n$/, '')} />
        );
      }

      return !inline && match ? (
        <Box
          sx={{
            my: 3,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #E0E7FF',
          }}
        >
          <Box
            sx={{
              bgcolor: '#1F2D5C',
              color: 'white',
              px: 2,
              py: 1,
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{language.toUpperCase()}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>CODE</span>
          </Box>
          <SyntaxHighlighter
            style={tomorrow}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              fontSize: '0.95rem',
              lineHeight: '1.6',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <code
          style={{
            backgroundColor: '#F5F7FF',
            color: '#1F2D5C',
            padding: '0.2em 0.4em',
            borderRadius: '3px',
            fontSize: '0.9em',
            fontFamily: 'monospace',
            border: '1px solid #E0E7FF',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    h2: ({ children }) => (
      <Typography
        variant="h4"
        sx={{
          mt: 5,
          mb: 3,
          fontWeight: 600,
          color: '#1F2D5C',
          borderBottom: '2px solid #E0E7FF',
          pb: 2,
        }}
      >
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography
        variant="h5"
        sx={{
          mt: 4,
          mb: 2.5,
          fontWeight: 600,
          color: '#2A3F5F',
          position: 'relative',
          '&:before': {
            content: '""',
            position: 'absolute',
            left: -20,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: '70%',
            bgcolor: '#C1D0FF',
            borderRadius: 2,
          }
        }}
      >
        {children}
      </Typography>
    ),
    h4: ({ children }) => (
      <Typography
        variant="h6"
        sx={{
          mt: 3,
          mb: 2,
          fontWeight: 600,
          color: '#3A4D6F',
          letterSpacing: '0.5px',
        }}
      >
        {children}
      </Typography>
    ),
    p: ({ children }) => (
      <Typography
        variant="body1"
        sx={{
          mb: 3,
          lineHeight: 1.9,
          color: '#4A5568',
          fontSize: '1.05rem',
          textAlign: 'justify',
          '& code': {
            bgcolor: '#F5F7FF',
            color: '#1F2D5C',
            px: 0.8,
            py: 0.2,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.9em',
            border: '1px solid #E0E7FF',
          }
        }}
      >
        {children}
      </Typography>
    ),
    ul: ({ children }) => (
      <Box
        component="ul"
        sx={{
          mb: 3,
          pl: 4,
          '& li': {
            mb: 1.5,
            '&::marker': {
              color: '#C1D0FF',
              fontSize: '1.2rem',
            }
          }
        }}
      >
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box
        component="ol"
        sx={{
          mb: 3,
          pl: 4,
          '& li': {
            mb: 1.5,
            '&::marker': {
              color: '#5A7FDB',
              fontWeight: 600,
            }
          }
        }}
      >
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Box component="li" sx={{ mb: 1.5 }}>
        <Typography
          variant="body1"
          sx={{
            lineHeight: 1.8,
            color: '#4A5568',
            fontSize: '1.05rem',
          }}
        >
          {children}
        </Typography>
      </Box>
    ),
    table: ({ children }) => {
      // Extract table data from children
      const extractTableData = (tableChildren) => {
        const headers = [];
        const rows = [];

        React.Children.forEach(tableChildren, (child) => {
          if (!child || !child.props) return;

          if (child.props.originalType === 'thead' || child.type?.name === 'thead') {
            React.Children.forEach(child.props.children, (thead) => {
              if (!thead || !thead.props) return;
              React.Children.forEach(thead.props.children, (th) => {
                if (!th || !th.props) return;
                headers.push(th.props.children || '');
              });
            });
          }

          if (child.props.originalType === 'tbody' || child.type?.name === 'tbody') {
            React.Children.forEach(child.props.children, (tr) => {
              if (!tr || !tr.props) return;
              const row = [];
              React.Children.forEach(tr.props.children, (td) => {
                if (!td || !td.props) return;
                row.push(td.props.children || '');
              });
              if (row.length > 0) rows.push(row);
            });
          }
        });

        return { headers, rows };
      };

      const { headers, rows } = extractTableData(children);

      if (headers.length === 0 && rows.length === 0) {
        // Fallback to original table if extraction fails
        return (
          <TableContainer component={Paper} sx={{ my: 3 }}>
            <Table sx={{
              '& th, & td': {
                border: '1px solid #e0e0e0',
              },
              '& th': {
                bgcolor: '#C1D0FF',
                color: '#1F2D5C',
                fontWeight: 600
              }
            }}>
              {children}
            </Table>
          </TableContainer>
        );
      }

      return (
        <TableContainer component={Paper} elevation={1} sx={{ my: 3 }}>
          <Table>
            {headers.length > 0 && (
              <TableHead>
                <TableRow sx={{ bgcolor: '#C1D0FF' }}>
                  {headers.map((header, index) => (
                    <TableCell
                      key={index}
                      sx={{
                        color: '#1F2D5C',
                        fontWeight: 600,
                        borderBottom: '2px solid #1F2D5C'
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    '&:nth-of-type(odd)': { bgcolor: '#F8F9FF' },
                    '&:hover': { bgcolor: '#E8EEFF' }
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    },
    thead: ({ children }) => <thead>{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => <th>{children}</th>,
    td: ({ children }) => <td>{children}</td>,
    blockquote: ({ children }) => (
      <Paper
        elevation={0}
        sx={{
          borderLeft: '5px solid #C1D0FF',
          bgcolor: 'linear-gradient(135deg, #F8F9FF 0%, #F0F4FF 100%)',
          background: 'linear-gradient(135deg, #F8F9FF 0%, #F0F4FF 100%)',
          p: 3,
          my: 4,
          position: 'relative',
          '&:before': {
            content: '"💡"',
            position: 'absolute',
            top: -10,
            left: 20,
            bgcolor: 'white',
            px: 1,
            fontSize: '1.5rem',
          },
          '& p': {
            mb: 0,
            fontStyle: 'italic',
            color: '#2D3748',
          }
        }}
      >
        {children}
      </Paper>
    ),
    strong: ({ children }) => (
      <Box
        component="strong"
        sx={{
          fontWeight: 700,
          color: '#1A202C',
          background: 'linear-gradient(to bottom, transparent 60%, #C1D0FF 60%)',
          px: 0.3,
        }}
      >
        {children}
      </Box>
    ),
    em: ({ children }) => (
      <Box
        component="em"
        sx={{
          fontStyle: 'italic',
          color: '#2D3748',
          letterSpacing: '0.3px',
        }}
      >
        {children}
      </Box>
    ),
    hr: () => (
      <Divider
        sx={{
          my: 5,
          borderColor: '#E0E7FF',
          '&:before, &:after': {
            borderColor: '#E0E7FF',
          },
          '&': {
            position: 'relative',
            '&:after': {
              content: '"◆"',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'white',
              color: '#C1D0FF',
              px: 2,
              fontSize: '12px',
            }
          }
        }}
      />
    ),
    pre: ({ children }) => {
      // Check if this is a code block (will be handled by code component)
      if (React.Children.toArray(children).some(child =>
        child?.props?.className?.includes('language-')
      )) {
        return <>{children}</>;
      }
      // Otherwise render as preformatted text
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            my: 2,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            overflowX: 'auto'
          }}
        >
          <pre style={{ margin: 0, fontFamily: 'monospace' }}>{children}</pre>
        </Paper>
      );
    }
  };

  return (
    <Box sx={{
      py: 3,
      px: '22px',
      maxWidth: '900px',
      mx: 'auto',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/owner-account/onboarding')}
        sx={{ mb: 3 }}
      >
        Back to Articles
      </Button>

      {/* Article Header */}
      <Box sx={{ mb: 5 }}>
        <Chip
          label={article.category}
          sx={{
            bgcolor: 'rgba(193, 208, 255, 0.50)',
            color: '#1F2D5C',
            fontWeight: 600,
            mb: 3,
            px: 2,
            py: 0.5,
            fontSize: '0.9rem',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 4px rgba(31, 45, 92, 0.1)',
          }}
        />

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 2.5,
            color: '#1A202C',
            letterSpacing: '-0.5px',
            lineHeight: 1.3,
          }}
        >
          {article.title}
        </Typography>

        {article.subTitle && (
          <Typography
            variant="h6"
            sx={{
              fontStyle: 'italic',
              color: '#718096',
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: '80%',
            }}
          >
            {article.subTitle}
          </Typography>
        )}
      </Box>

      {/* Featured Image */}
      {article.image && (
        <Box
          sx={{
            width: '100%',
            height: '400px',
            backgroundImage: `url(${article.image})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            borderRadius: 2,
            mb: 4
          }}
        />
      )}

      {/* Article Content */}
      <Paper
        sx={{
          p: { xs: 3, md: 5 },
          bgcolor: 'white',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #F0F4F8',
        }}
        elevation={0}
      >
        {article.contentList.map((content, index) => (
          <Box key={index}>
            {content.text.map((textBlock, textIndex) => (
              <ReactMarkdown
                key={textIndex}
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {textBlock}
              </ReactMarkdown>
            ))}
          </Box>
        ))}
      </Paper>

      {/* Navigation */}
      <Box sx={{ mt: 6, mb: 4, display: 'flex', justifyContent: 'space-between' }}>
        {parseInt(id) > 1 && (
          <Button
            variant="outlined"
            onClick={() => navigate(`/owner-account/onboarding/article/${parseInt(id) - 1}`)}
          >
            ← Previous Article
          </Button>
        )}

        {parseInt(id) < landlordArticles.length && (
          <Button
            variant="outlined"
            onClick={() => navigate(`/owner-account/onboarding/article/${parseInt(id) + 1}`)}
            sx={{ ml: 'auto' }}
          >
            Next Article →
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default OnboardingArticle;