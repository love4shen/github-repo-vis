import d3 from 'd3';

let node;
let link;
let label;
let force;
let datetime;
let nodes;
let links;

const constructVis = (domNode, commitData) => {
  const width = 960;
  const height = 600;
  nodes = [];
  links = [];

  d3.select(domNode).select('svg').remove();

  const svg = d3.select(domNode).append("svg")
  .attr("width", width)
  .attr("height", height);

  force = d3.layout.force()
  .nodes(nodes)
  .links(links)
  .gravity(0.05)
  .linkDistance((l) => l.target.netChange >= 0 ? Math.sqrt(l.target.netChange) / 2 : 12)
  .charge(-100)
  .size([width, height])
  .on("tick", tick);

  node = svg.selectAll(".node");
  link = svg.selectAll(".link");
  label = svg.selectAll('.label')
  datetime = svg.append('text')
    .attr('class', 'showTime')
    .attr('x', 20)
    .attr('y', 20);
  
  startVis(commitData);
};

export default constructVis;

function tick() {
  link.attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });

  node.attr("cx", function (d) { return d.x; })
    .attr("cy", function (d) { return d.y; });

  label.attr('x', (d) => d.x)
    .attr('y', (d) => d.y);
}


function start(time) {
  link = link.data(force.links(), function (d) { return d.source.id + "->" + d.target.id; });
  link.enter().insert("line", ".node").attr("class", "link");
  link.exit().remove();

  node = node.data(force.nodes(), function (d) { return d.id; }).call(force.drag())
  node.enter()
    .append("circle")
    .attr('data-id', d => d.id)
    .attr("class", d => d.netChange >= 0 ? 'node node-file' : 'node')
    .attr("r", d => {
      return d.netChange >= 0 ? Math.sqrt(d.netChange) / 3 : 4
    })
    .attr('fill', (d) => d.id === '/' ? '#000' : d.netChange >= 0 ? '#F44336' : '#2196F3')
    .attr('data-fixed', (d) => {
      if (d.id === '/') {
        setTimeout(() => {
          d.fixed = true;
        }, 2000)
      }

      d.fixed = false;
      return false;
    })
    .on("mouseover", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', null);
    })
    .on("mouseout", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', 'none');
    });
  node.exit().remove();

  label = label.data(force.nodes(), (d) => d.id)
  label.enter()
    .append("text")
    .attr('x', (d) => d.x)
    .attr('y', (d) => d.y)
    .attr('data-id', (d) => d.id)
    .text((d) => d.id.split('/').slice(-1)[0])
    .attr("class", 'label')
    .style('display', 'none')
    .on("mouseover", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', null);
    })
    .on("mouseout", (d) => {
      d3.select(`.label[data-id="${d.id}"]`).style('display', 'none');
    })
  label.exit().remove();

  force.start();
}

function startVis(commitsData) {
  const shas = Object.keys(commitsData).reverse();
  const commits = shas.map(sha => commitsData[sha]);
  const nodesMap = {};
  const linksMap = {};
  const firstTime = new Date(commits[0].committer.date);
  const lastTime = new Date(commits[commits.length - 1].committer.date);
  const animationDuration = 20000;
  const tickFreq = 400;
  const timeSpace = animationDuration / (lastTime - firstTime);
  const showTimeInterval = (lastTime - firstTime) / tickFreq;

  const toTwoDigit = (n) => n < 10 ? `0${n}` : `${n}`;

  for (let i = 0; i <= tickFreq; i++) {
    // eslint-disable-next-line
    setTimeout(() => {
      const time = new Date(showTimeInterval * i + (+firstTime))

      const year = time.getFullYear();
      const month = time.getMonth() + 1;
      const day = time.getDay();
      // const hour = time.getHours();
      // const minute = time.getMinutes();

      datetime.text(`${toTwoDigit(year)}-${toTwoDigit(month)}-${toTwoDigit(day)}`);
    
    }, animationDuration / tickFreq * i);
  }

  for (let i = 0; i < shas.length; i++) {
    const sha = shas[i];

    const { committer, files } = commitsData[sha]; // stat

    const time = new Date(committer.date);

    // eslint-disable-next-line
    setTimeout(() => {
      files.forEach(file => {

        const absoluteFileName = `/${file.filename}`;

        if (absoluteFileName in nodesMap) {
          nodesMap[absoluteFileName].netChange += Number(file.changes);
          const { id, netChange } = nodesMap[absoluteFileName];

          d3.selectAll('.node').each(function (d) {
            if (d3.select(this)[0][0].getAttribute('data-id') === id) {
              d3.select(this)[0][0].setAttribute('r', Math.sqrt(netChange) / 3);
            }
          });
        } else {
          const path = file.filename.split('/');

          // add new nodes
          let folder = '/';

          for (let i = 0; i <= path.length; i++) {
            if (!(folder in nodesMap)) {

              if (i === path.length) {
                // file node
                nodesMap[`/${file.filename}`] = {
                  id: `/${file.filename}`,
                  netChange: Number(file.changes),
                };

                nodes.push(nodesMap[`/${file.filename}`]);
              } else {
                // folder node
                nodesMap[folder] = {
                  id: folder,
                  netChange: -1,
                };

                nodes.push(nodesMap[folder]);
              }
            }

            folder += `${path[i]}/`;
          }

          // add new edges
          let source = '/';
          for (let i = 0; i < path.length; i++) {
            let target;

            if (i === path.length - 1) {
              target = `${source}${path[i]}`;
            } else {
              target = `${source}${path[i]}/`;
            }

            const linkId = `${source}->${target}`;

            if (!(linkId in linksMap)) {
              linksMap[linkId] = {
                source: nodesMap[source],
                target: nodesMap[target],
              };

              links.push(linksMap[linkId]);
            }

            source += `${path[i]}/`;
          }
        }

      });

      start(time);

    }, timeSpace * (time - firstTime));
  }
}
