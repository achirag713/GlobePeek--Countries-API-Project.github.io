
import React, { useEffect, useState } from 'react'
import './CountryDetail.css'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import CountryDetailShimmer from './CountryDetailShimmer'

const API_KEY = 'rc_live_demo'
const API_BASE = 'https://api.restcountries.com/countries/v5'

const headers = {
  Authorization: `Bearer ${API_KEY}`,
}

function getNativeName(country) {
  const nativeNames =
    country.names?.native ?? country.name?.nativeName ?? {}

  const firstNativeName = Object.values(nativeNames)[0]

  return (
    firstNativeName?.common ??
    firstNativeName?.name ??
    country.names?.official ??
    country.name?.common ??
    country.name ??
    'Unknown'
  )
}

function getCountryName(country) {
  return (
    country.names?.common ??
    country.name?.common ??
    country.name ??
    'Unknown'
  )
}

function getCountryFlag(country) {
  return country.flag?.url_svg ?? country.flags?.svg ?? ''
}

function getCapitals(country) {
  // v5: capitals is an array of objects.
  // The list component normalizes it to an array of strings.
  return (country.capitals ?? country.capital ?? []).map(
    (capital) =>
      typeof capital === 'string' ? capital : capital.name
  ).filter(Boolean)
}

function getCurrencies(country) {
  const currencies = country.currencies ?? {}

  if (Array.isArray(currencies)) {
    return currencies.map((currency) => currency.name).filter(Boolean).join(', ')
  }

  return Object.values(currencies)
    .map((currency) => currency.name)
    .filter(Boolean)
    .join(', ')
}

function getLanguages(country) {
  const languages = country.languages ?? {}

  if (Array.isArray(languages)) {
    return languages.map((language) => language.name).filter(Boolean).join(', ')
  }

  return Object.values(languages).join(', ')
}

export default function CountryDetail() {
  const [isDark] = useTheme()
  const { country: countryName } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [countryData, setCountryData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function fetchJSON(url) {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      })

      const result = await response.json()

      if (!response.ok || result.errors?.length) {
        throw new Error(
          result.errors?.[0]?.message ??
          `API request failed: ${response.status}`
        )
      }

      return result
    }

    async function loadCountry() {
      try {
        setCountryData(null)
        setNotFound(false)
        setError('')

        let country

        // Reuse the country object supplied by CountryCard
        // when navigating from the country list.
        if (state) {
          country = state
        } else {
          const result = await fetchJSON(
            `${API_BASE}/names.common/${encodeURIComponent(countryName)}`
          )

          country = result.data?.objects?.[0]

          if (!country) {
            setNotFound(true)
            return
          }
        }

        const borderCodes = country.borders ?? []

        const borders = await Promise.all(
          borderCodes.map(async (code) => {
            try {
              const result = await fetchJSON(
                `${API_BASE}/codes.alpha_3/${encodeURIComponent(code)}`
              )

              const borderCountry = result.data?.objects?.[0]

              return borderCountry
                ? {
                    name: getCountryName(borderCountry),
                    code,
                  }
                : null
            } catch (err) {
              if (err.name === 'AbortError') throw err

              console.error(`Failed to fetch border country ${code}:`, err)
              return null
            }
          })
        )

        if (controller.signal.aborted) return

        setCountryData({
          name: getCountryName(country),
          nativeName: getNativeName(country),
          population: country.population ?? 0,
          region: country.region ?? 'N/A',
          subregion: country.subregion ?? 'N/A',
          capital: getCapitals(country),
          flag: getCountryFlag(country),
          tld: country.tld ?? country.tlds ?? [],
          languages: getLanguages(country) || 'N/A',
          currencies: getCurrencies(country) || 'N/A',
          borders: borders.filter(Boolean),
        })
      } catch (err) {
        if (err.name === 'AbortError') return

        console.error('Failed to load country:', err)
        setError(err.message || 'Unable to load country details.')
      }
    }

    if (countryName || state) {
      loadCountry()
    } else {
      setNotFound(true)
    }

    return () => controller.abort()
  }, [countryName, state])

  if (notFound) {
    return <main className={isDark ? 'dark' : ''}>Country Not Found</main>
  }

  if (error) {
    return (
      <main className={isDark ? 'dark' : ''}>
        <div className="country-details-container">
          <button type="button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <p>{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className={isDark ? 'dark' : ''}>
      <div className="country-details-container">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <i className="fa-solid fa-arrow-left" />&nbsp; Back
        </button>

        {countryData === null ? (
          <CountryDetailShimmer />
        ) : (
          <div className="country-details">
            {countryData.flag && (
              <img
                src={countryData.flag}
                alt={`${countryData.name} flag`}
              />
            )}

            <div className="details-text-container">
              <h1>{countryData.name}</h1>

              <div className="details-text">
                <p>
                  <b>Native Name: {countryData.nativeName}</b>
                </p>
                <p>
                  <b>
                    Population:{' '}
                    {countryData.population.toLocaleString('en-IN')}
                  </b>
                </p>
                <p>
                  <b>Region: {countryData.region}</b>
                </p>
                <p>
                  <b>Sub Region: {countryData.subregion}</b>
                </p>
                <p>
                  <b>Capital: {countryData.capital.join(', ') || 'N/A'}</b>
                </p>
                <p>
                  <b>
                    Top Level Domain:{' '}
                    {Array.isArray(countryData.tld)
                      ? countryData.tld.join(', ') || 'N/A'
                      : countryData.tld || 'N/A'}
                  </b>
                </p>
                <p>
                  <b>Currencies: {countryData.currencies}</b>
                </p>
                <p>
                  <b>Languages: {countryData.languages}</b>
                </p>
              </div>

              {countryData.borders.length > 0 && (
                <div className="border-countries">
                  <b>Border Countries: </b>&nbsp;

                  {countryData.borders.map((border) => (
                    <Link
                      key={border.code}
                      to={`/${encodeURIComponent(border.name)}`}
                    >
                      {border.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
