<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="sm xhtml">

  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Sitemap — Fencing NB</title>
        <style>
          :root { --teal: #006156; --crimson: #79242f; }
          body { margin: 0; font-family: Avenir, 'Nunito Sans', system-ui, sans-serif; color: #222; background: #f4f8f7; }
          header { background: var(--teal); color: #fff; padding: 1.5rem 2rem; }
          header h1 { margin: 0; font-size: 1.4rem; font-weight: 700; }
          header p { margin: .3rem 0 0; font-size: .9rem; opacity: .8; }
          main { max-width: 1100px; margin: 2rem auto; padding: 0 1.5rem 3rem; }
          table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
          thead th { background: var(--teal); color: #fff; text-align: left; padding: .7rem 1rem; font-size: .8rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
          tbody tr:nth-child(even) { background: #f4f8f7; }
          tbody td { padding: .6rem 1rem; border-top: 1px solid #e0ecea; font-size: .88rem; vertical-align: top; }
          a { color: var(--teal); text-decoration: none; word-break: break-all; }
          a:hover { text-decoration: underline; }
          .lang { display: inline-block; background: #e0ecea; color: var(--teal); border-radius: 3px; padding: .1rem .35rem; font-size: .75rem; margin: .1rem .15rem 0 0; font-weight: 600; }
          .date { color: #555; white-space: nowrap; }
        </style>
      </head>
      <body>
        <header>
          <h1>Fencing NB — Sitemap</h1>
          <p><xsl:value-of select="count(sm:urlset/sm:url)"/> URLs</p>
        </header>
        <main>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Last Modified</th>
                <th>Alternate Languages</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sm:urlset/sm:url">
                <tr>
                  <td><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></td>
                  <td class="date"><xsl:value-of select="substring(sm:lastmod, 1, 10)"/></td>
                  <td>
                    <xsl:for-each select="xhtml:link[@rel='alternate']">
                      <span class="lang"><xsl:value-of select="@hreflang"/></span>
                    </xsl:for-each>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </main>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
